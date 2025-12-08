import type { Endpoint } from 'payload'
import { Polar } from '@polar-sh/sdk'

// Initialize Polar client
const getPolarClient = () => {
  const accessToken = process.env.POLAR_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN is not configured')
  }

  // Use sandbox server if POLAR_SANDBOX=true
  const useSandbox = process.env.POLAR_SANDBOX === 'true'

  return new Polar({
    accessToken,
    server: useSandbox ? 'sandbox' : 'production',
  })
}

/**
 * Create Checkout Session
 * POST /api/polar/checkout
 *
 * Creates a Polar checkout session for upgrading to a paid plan
 */
export const polarCheckoutEndpoint: Endpoint = {
  path: '/polar/checkout',
  method: 'post',
  handler: async (req) => {
    try {
      // Get authenticated user
      const user = req.user
      if (!user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 })
      }

      const body = await req.json?.()
      const { planSlug } = body || {}

      if (!planSlug) {
        return Response.json({ error: 'Plan slug is required' }, { status: 400 })
      }

      // Get the plan
      const plansResult = await req.payload.find({
        collection: 'plans',
        where: { slug: { equals: planSlug } },
        limit: 1,
      })

      if (plansResult.docs.length === 0) {
        return Response.json({ error: 'Plan not found' }, { status: 404 })
      }

      const plan = plansResult.docs[0]

      if (!plan.polarProductId) {
        return Response.json({ error: 'Plan not configured for payments' }, { status: 400 })
      }

      // Check if user already has an active subscription
      const existingPlan = await req.payload.find({
        collection: 'user-plans',
        where: {
          user: { equals: user.id },
          status: { in: ['active', 'trialing'] },
        },
        limit: 1,
      })

      if (existingPlan.docs.length > 0) {
        const currentPlan = existingPlan.docs[0]
        const currentPlanData =
          typeof currentPlan.plan === 'object' ? currentPlan.plan : null

        // If already on lifetime, can't upgrade
        if (currentPlanData?.billingCycle === 'lifetime') {
          return Response.json(
            { error: 'You already have a lifetime subscription' },
            { status: 400 },
          )
        }
      }

      const polar = getPolarClient()

      // Create checkout session
      const successUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/settings?billing=success`

      const checkout = await polar.checkouts.create({
        products: [plan.polarProductId],
        successUrl,
        customerEmail: user.email,
        metadata: {
          userId: String(user.id),
          planId: String(plan.id),
          planSlug: plan.slug,
        },
      })

      return Response.json({
        checkoutUrl: checkout.url,
        checkoutId: checkout.id,
      })
    } catch (error) {
      console.error('Polar checkout error:', error)
      return Response.json(
        { error: 'Failed to create checkout session' },
        { status: 500 },
      )
    }
  },
}

/**
 * Polar Webhook Handler
 * POST /api/polar/webhook
 *
 * Handles Polar webhook events for subscription lifecycle
 */
export const polarWebhookEndpoint: Endpoint = {
  path: '/polar/webhook',
  method: 'post',
  handler: async (req) => {
    try {
      const webhookSecret = process.env.POLAR_WEBHOOK_SECRET
      if (!webhookSecret) {
        console.error('POLAR_WEBHOOK_SECRET not configured')
        return Response.json({ error: 'Webhook not configured' }, { status: 500 })
      }

      // Get raw body for signature verification
      const rawBody = await req.text?.()
      if (!rawBody) {
        return Response.json({ error: 'Empty body' }, { status: 400 })
      }

      // Verify webhook signature
      const signature = req.headers.get('webhook-signature') || req.headers.get('x-polar-signature')

      // Parse the event
      const event = JSON.parse(rawBody)

      console.log('Polar webhook event:', event.type, JSON.stringify(event.data, null, 2))

      switch (event.type) {
        case 'checkout.created':
          // Checkout started - optional tracking
          console.log('Checkout created:', event.data.id)
          break

        case 'checkout.updated':
          // Checkout updated - check if completed
          console.log('Checkout updated:', event.data.id, 'status:', event.data.status)
          if (event.data.status === 'succeeded' || event.data.status === 'confirmed') {
            await handleCheckoutCompleted(req.payload, event.data)
          }
          break

        case 'subscription.created':
        case 'subscription.active':
          await handleSubscriptionActive(req.payload, event.data)
          break

        case 'subscription.updated':
          await handleSubscriptionUpdated(req.payload, event.data)
          break

        case 'subscription.canceled':
        case 'subscription.revoked':
          await handleSubscriptionCancelled(req.payload, event.data)
          break

        case 'order.created':
          // One-time purchase (lifetime plan)
          await handleOrderCreated(req.payload, event.data)
          break

        default:
          console.log('Unhandled webhook event:', event.type)
      }

      return Response.json({ received: true })
    } catch (error) {
      console.error('Polar webhook error:', error)
      return Response.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
  },
}

/**
 * Get Customer Portal URL
 * GET /api/polar/portal
 *
 * Returns the Polar customer portal URL for managing subscriptions
 */
export const polarPortalEndpoint: Endpoint = {
  path: '/polar/portal',
  method: 'get',
  handler: async (req) => {
    try {
      const user = req.user
      if (!user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Get user's active subscription
      const userPlan = await req.payload.find({
        collection: 'user-plans',
        where: {
          user: { equals: user.id },
          status: { in: ['active', 'trialing'] },
          paymentProvider: { equals: 'polar' },
        },
        limit: 1,
      })

      if (userPlan.docs.length === 0 || !userPlan.docs[0].externalCustomerId) {
        return Response.json({ error: 'No active Polar subscription found' }, { status: 404 })
      }

      // Polar customer portal URL
      const portalUrl = `https://polar.sh/purchases/subscriptions`

      return Response.json({ portalUrl })
    } catch (error) {
      console.error('Polar portal error:', error)
      return Response.json({ error: 'Failed to get portal URL' }, { status: 500 })
    }
  },
}

// Helper functions for webhook handlers

async function handleCheckoutCompleted(payload: any, data: any) {
  console.log('handleCheckoutCompleted called with data:', JSON.stringify(data, null, 2))

  const metadata = data.metadata || {}
  const userId = metadata.userId || metadata.user_id
  const planId = metadata.planId || metadata.plan_id

  console.log('Extracted metadata - userId:', userId, 'planId:', planId)

  if (!userId || !planId) {
    console.error('Missing metadata in checkout:', metadata)
    return
  }

  // Check if user plan already exists
  const existing = await payload.find({
    collection: 'user-plans',
    where: {
      user: { equals: userId },
      externalSubscriptionId: { equals: data.id },
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return // Already processed
  }

  // Convert to numbers for relationship fields
  const userIdNum = Number(userId)
  const planIdNum = Number(planId)

  // Get the plan to check billing cycle for expiration calculation
  const plan = await payload.findByID({
    collection: 'plans',
    id: planIdNum,
  })

  // Calculate expiresAt based on billing cycle
  let expiresAt: string | null = null
  if (plan && plan.billingCycle !== 'lifetime' && plan.billingCycle !== 'free') {
    const now = new Date()
    if (plan.billingCycle === 'monthly') {
      now.setMonth(now.getMonth() + 1)
    } else if (plan.billingCycle === 'yearly') {
      now.setFullYear(now.getFullYear() + 1)
    }
    expiresAt = now.toISOString()
  }

  // Deactivate any existing active plans
  await deactivateExistingPlans(payload, String(userIdNum))

  // Create new user plan
  await payload.create({
    collection: 'user-plans',
    data: {
      user: userIdNum,
      plan: planIdNum,
      status: 'active',
      startDate: new Date().toISOString(),
      expiresAt,
      paymentProvider: 'polar',
      externalSubscriptionId: data.subscription_id || data.id,
      externalCustomerId: data.customer_id,
      metadata: data,
    },
  })

  console.log(`Created user plan for user ${userId}, expiresAt: ${expiresAt}`)
}

async function handleSubscriptionActive(payload: any, data: any) {
  console.log('handleSubscriptionActive called')

  const customerId = data.customer_id
  const subscriptionId = data.id
  const metadata = data.metadata || {}
  const userId = metadata.userId || metadata.user_id
  const planId = metadata.planId || metadata.plan_id

  // Extract expiration from Polar data - try multiple field names
  const expiresAt = data.current_period_end
    || data.currentPeriodEnd
    || data.ends_at
    || data.endsAt
    || null

  console.log('Subscription data - userId:', userId, 'planId:', planId, 'customerId:', customerId, 'expiresAt:', expiresAt)

  // First try to find by subscription ID
  const existingBySubscription = await payload.find({
    collection: 'user-plans',
    where: {
      externalSubscriptionId: { equals: subscriptionId },
    },
    limit: 1,
  })

  if (existingBySubscription.docs.length > 0) {
    console.log('Found existing plan by subscription ID, updating...')
    await payload.update({
      collection: 'user-plans',
      id: existingBySubscription.docs[0].id,
      data: {
        status: 'active',
        expiresAt,
        metadata: data,
      },
    })
    return
  }

  // Try to find by customer ID
  const existingByCustomer = await payload.find({
    collection: 'user-plans',
    where: {
      externalCustomerId: { equals: customerId },
    },
    limit: 1,
  })

  if (existingByCustomer.docs.length > 0) {
    console.log('Found existing plan by customer ID, updating...')
    await payload.update({
      collection: 'user-plans',
      id: existingByCustomer.docs[0].id,
      data: {
        status: 'active',
        expiresAt,
        externalSubscriptionId: subscriptionId,
        metadata: data,
      },
    })
    return
  }

  // No existing plan found - create new one if we have metadata
  if (userId && planId) {
    console.log('Creating new user plan from subscription.active event')

    // Convert to numbers for relationship fields
    const userIdNum = Number(userId)
    const planIdNum = Number(planId)

    // Deactivate any existing active plans for this user
    await deactivateExistingPlans(payload, String(userIdNum))

    await payload.create({
      collection: 'user-plans',
      data: {
        user: userIdNum,
        plan: planIdNum,
        status: 'active',
        startDate: new Date().toISOString(),
        expiresAt,
        paymentProvider: 'polar',
        externalSubscriptionId: subscriptionId,
        externalCustomerId: customerId,
        metadata: data,
      },
    })
    console.log(`Created user plan for user ${userId} from subscription.active, expiresAt: ${expiresAt}`)
  } else {
    console.log('No metadata found in subscription.active, cannot create plan')
  }
}

async function handleSubscriptionUpdated(payload: any, data: any) {
  const subscriptionId = data.id

  // Extract expiration from Polar data - try multiple field names
  const expiresAt = data.current_period_end
    || data.currentPeriodEnd
    || data.ends_at
    || data.endsAt
    || data.ended_at
    || null

  console.log('handleSubscriptionUpdated - subscriptionId:', subscriptionId, 'expiresAt:', expiresAt, 'status:', data.status)

  const existingPlan = await payload.find({
    collection: 'user-plans',
    where: {
      externalSubscriptionId: { equals: subscriptionId },
    },
    limit: 1,
  })

  if (existingPlan.docs.length > 0) {
    const status = mapPolarStatus(data.status)

    // If subscription is being changed to a new product, update the plan reference
    const updateData: any = {
      status,
      expiresAt,
      metadata: data,
    }

    // If the subscription has a new product, try to find the matching plan
    if (data.product_id || data.productId) {
      const productId = data.product_id || data.productId
      const matchingPlan = await payload.find({
        collection: 'plans',
        where: {
          polarProductId: { equals: productId },
        },
        limit: 1,
      })

      if (matchingPlan.docs.length > 0) {
        updateData.plan = matchingPlan.docs[0].id
        console.log('Updating plan to:', matchingPlan.docs[0].name)
      }
    }

    await payload.update({
      collection: 'user-plans',
      id: existingPlan.docs[0].id,
      data: updateData,
    })
  }
}

async function handleSubscriptionCancelled(payload: any, data: any) {
  const subscriptionId = data.id

  const existingPlan = await payload.find({
    collection: 'user-plans',
    where: {
      externalSubscriptionId: { equals: subscriptionId },
    },
    limit: 1,
  })

  if (existingPlan.docs.length > 0) {
    await payload.update({
      collection: 'user-plans',
      id: existingPlan.docs[0].id,
      data: {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        metadata: data,
      },
    })
  }
}

async function handleOrderCreated(payload: any, data: any) {
  // Only handle one-time purchases (lifetime plans), not subscription orders
  if (data.subscription_id || data.billing_reason === 'subscription_create' || data.billing_reason === 'subscription_cycle') {
    console.log('Skipping order.created for subscription order:', data.billing_reason)
    return
  }

  console.log('handleOrderCreated for one-time purchase')

  // Handle one-time purchases (lifetime plans)
  const metadata = data.metadata || {}
  const userId = metadata.userId || metadata.user_id
  const planId = metadata.planId || metadata.plan_id

  if (!userId || !planId) {
    console.error('Missing metadata in order:', metadata)
    return
  }

  // Check if already processed
  const existing = await payload.find({
    collection: 'user-plans',
    where: {
      user: { equals: userId },
      externalSubscriptionId: { equals: data.id },
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return
  }

  // Convert to numbers for relationship fields
  const userIdNum = Number(userId)
  const planIdNum = Number(planId)

  // Deactivate existing plans
  await deactivateExistingPlans(payload, String(userIdNum))

  // Create lifetime plan
  await payload.create({
    collection: 'user-plans',
    data: {
      user: userIdNum,
      plan: planIdNum,
      status: 'active',
      startDate: new Date().toISOString(),
      expiresAt: null, // Lifetime never expires
      paymentProvider: 'polar',
      externalSubscriptionId: data.id,
      externalCustomerId: data.customer_id,
      metadata: data,
    },
  })

  console.log(`Created lifetime plan for user ${userId}`)
}

async function deactivateExistingPlans(payload: any, userId: string) {
  const activePlans = await payload.find({
    collection: 'user-plans',
    where: {
      user: { equals: userId },
      status: { in: ['active', 'trialing'] },
    },
  })

  for (const plan of activePlans.docs) {
    await payload.update({
      collection: 'user-plans',
      id: plan.id,
      data: {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      },
    })
  }
}

function mapPolarStatus(polarStatus: string): string {
  switch (polarStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'cancelled':
      return 'cancelled'
    case 'unpaid':
      return 'past_due'
    default:
      return 'active'
  }
}

/**
 * Preview Upgrade Cost
 * POST /api/polar/upgrade-preview
 *
 * Calculates and returns the proration cost for upgrading/changing plans
 */
export const polarUpgradePreviewEndpoint: Endpoint = {
  path: '/polar/upgrade-preview',
  method: 'post',
  handler: async (req) => {
    try {
      const user = req.user
      if (!user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 })
      }

      const body = await req.json?.()
      const { targetPlanSlug } = body || {}

      if (!targetPlanSlug) {
        return Response.json({ error: 'Target plan slug is required' }, { status: 400 })
      }

      // Get target plan
      const targetPlanResult = await req.payload.find({
        collection: 'plans',
        where: { slug: { equals: targetPlanSlug } },
        limit: 1,
      })

      if (targetPlanResult.docs.length === 0) {
        return Response.json({ error: 'Target plan not found' }, { status: 404 })
      }

      const targetPlan = targetPlanResult.docs[0]

      if (!targetPlan.polarProductId) {
        return Response.json({ error: 'Target plan not configured for payments' }, { status: 400 })
      }

      // Get user's current plan
      const currentUserPlan = await req.payload.find({
        collection: 'user-plans',
        where: {
          user: { equals: user.id },
          status: { in: ['active', 'trialing'] },
        },
        depth: 1,
        limit: 1,
      })

      const hasActiveSubscription = currentUserPlan.docs.length > 0
      const currentPlan = hasActiveSubscription
        ? (typeof currentUserPlan.docs[0].plan === 'object' ? currentUserPlan.docs[0].plan : null)
        : null

      // Check if user has lifetime - can't upgrade from lifetime
      if (currentPlan?.billingCycle === 'lifetime') {
        return Response.json({
          error: 'You already have a lifetime subscription',
          canUpgrade: false,
        }, { status: 400 })
      }

      // Calculate proration preview
      const now = new Date()
      let prorationCredit = 0
      let daysRemaining = 0
      let totalDaysInCycle = 30

      if (hasActiveSubscription && currentPlan) {
        const userPlanDoc = currentUserPlan.docs[0]
        const expiresAt = userPlanDoc.expiresAt ? new Date(userPlanDoc.expiresAt) : null

        if (expiresAt && expiresAt > now) {
          daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          // Calculate total days in billing cycle
          if (currentPlan.billingCycle === 'monthly') {
            totalDaysInCycle = 30
          } else if (currentPlan.billingCycle === 'yearly') {
            totalDaysInCycle = 365
          }

          // Calculate prorated credit (unused portion of current plan)
          const currentPrice = currentPlan.price || 0
          prorationCredit = (currentPrice / totalDaysInCycle) * daysRemaining
        }
      }

      // Calculate what they'll pay
      const targetPrice = targetPlan.price || 0

      // Determine upgrade type
      let upgradeType: 'new_subscription' | 'plan_change' | 'immediate_charge'
      if (!hasActiveSubscription || !currentUserPlan.docs[0]?.externalSubscriptionId) {
        upgradeType = 'new_subscription' // Will create new checkout
      } else if (targetPlan.billingCycle === 'lifetime') {
        upgradeType = 'immediate_charge' // One-time purchase - NO proration from Polar
      } else {
        upgradeType = 'plan_change' // Update existing subscription - Polar handles proration
      }

      // Calculate amount due based on upgrade type
      let amountDue: number
      let message: string

      if (upgradeType === 'new_subscription') {
        // New subscription - full price
        amountDue = targetPrice
        message = `You'll be charged $${(targetPrice / 100).toFixed(2)} for ${targetPlan.name}`
      } else if (upgradeType === 'immediate_charge') {
        // Lifetime purchase - Polar does NOT apply proration for one-time purchases
        // User pays full lifetime price, their current subscription will be cancelled
        amountDue = targetPrice
        message = `You'll be charged $${(targetPrice / 100).toFixed(2)} for lifetime access. Your current subscription will be cancelled.`
      } else {
        // Plan change - Polar handles proration automatically
        // Our calculation is an estimate; actual amount may vary slightly
        amountDue = Math.max(0, targetPrice - prorationCredit)
        message = daysRemaining > 0
          ? `Polar will prorate your subscription. Estimated charge: $${(amountDue / 100).toFixed(2)} (after ~$${(prorationCredit / 100).toFixed(2)} credit for ${daysRemaining} unused days)`
          : `Your subscription will be updated to ${targetPlan.name}. You'll be charged $${(targetPrice / 100).toFixed(2)}.`
      }

      return Response.json({
        canUpgrade: true,
        upgradeType,
        currentPlan: currentPlan ? {
          name: currentPlan.name,
          price: currentPlan.price,
          billingCycle: currentPlan.billingCycle,
          daysRemaining,
        } : null,
        targetPlan: {
          name: targetPlan.name,
          price: targetPlan.price,
          billingCycle: targetPlan.billingCycle,
        },
        proration: {
          credit: upgradeType === 'plan_change' ? Math.round(prorationCredit * 100) / 100 : 0,
          amountDue: Math.round(amountDue * 100) / 100,
          daysRemaining,
          isEstimate: upgradeType === 'plan_change', // Mark as estimate for plan changes
        },
        message,
      })
    } catch (error) {
      console.error('Polar upgrade preview error:', error)
      return Response.json({ error: 'Failed to calculate upgrade cost' }, { status: 500 })
    }
  },
}

/**
 * Upgrade/Change Subscription
 * POST /api/polar/upgrade
 *
 * Upgrades or changes the user's subscription plan
 * - For users without subscription: Creates new checkout
 * - For users with subscription changing to another recurring plan: Updates subscription via Polar API
 * - For users upgrading to lifetime: Creates checkout with proration metadata
 */
export const polarUpgradeEndpoint: Endpoint = {
  path: '/polar/upgrade',
  method: 'post',
  handler: async (req) => {
    try {
      const user = req.user
      if (!user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 })
      }

      const body = await req.json?.()
      const { targetPlanSlug } = body || {}

      if (!targetPlanSlug) {
        return Response.json({ error: 'Target plan slug is required' }, { status: 400 })
      }

      // Get target plan
      const targetPlanResult = await req.payload.find({
        collection: 'plans',
        where: { slug: { equals: targetPlanSlug } },
        limit: 1,
      })

      if (targetPlanResult.docs.length === 0) {
        return Response.json({ error: 'Target plan not found' }, { status: 404 })
      }

      const targetPlan = targetPlanResult.docs[0]

      if (!targetPlan.polarProductId) {
        return Response.json({ error: 'Target plan not configured for payments' }, { status: 400 })
      }

      // Get user's current subscription
      const currentUserPlan = await req.payload.find({
        collection: 'user-plans',
        where: {
          user: { equals: user.id },
          status: { in: ['active', 'trialing'] },
          paymentProvider: { equals: 'polar' },
        },
        depth: 1,
        limit: 1,
      })

      const hasActiveSubscription = currentUserPlan.docs.length > 0
      const userPlanDoc = hasActiveSubscription ? currentUserPlan.docs[0] : null
      const currentPlan = userPlanDoc
        ? (typeof userPlanDoc.plan === 'object' ? userPlanDoc.plan : null)
        : null

      // Check if user has lifetime - can't upgrade from lifetime
      if (currentPlan?.billingCycle === 'lifetime') {
        return Response.json({
          error: 'You already have a lifetime subscription',
        }, { status: 400 })
      }

      const polar = getPolarClient()
      const successUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/settings?billing=success`

      // Case 1: No active subscription - create new checkout
      if (!hasActiveSubscription || !userPlanDoc?.externalSubscriptionId) {
        const checkout = await polar.checkouts.create({
          products: [targetPlan.polarProductId],
          successUrl,
          customerEmail: user.email,
          metadata: {
            userId: String(user.id),
            planId: String(targetPlan.id),
            planSlug: targetPlan.slug,
          },
        })

        return Response.json({
          action: 'checkout',
          checkoutUrl: checkout.url,
          checkoutId: checkout.id,
        })
      }

      // Case 2: Upgrading to lifetime (one-time purchase) - create checkout
      if (targetPlan.billingCycle === 'lifetime') {
        const checkout = await polar.checkouts.create({
          products: [targetPlan.polarProductId],
          successUrl,
          customerEmail: user.email,
          metadata: {
            userId: String(user.id),
            planId: String(targetPlan.id),
            planSlug: targetPlan.slug,
            upgradeFromSubscription: userPlanDoc.externalSubscriptionId,
          },
        })

        return Response.json({
          action: 'checkout',
          checkoutUrl: checkout.url,
          checkoutId: checkout.id,
          note: 'Your current subscription will be cancelled after lifetime purchase',
        })
      }

      // Case 3: Changing between recurring plans - update subscription via Polar API
      try {
        const updatedSubscription = await polar.subscriptions.update({
          id: userPlanDoc.externalSubscriptionId,
          subscriptionUpdate: {
            productId: targetPlan.polarProductId,
            prorationBehavior: 'prorate', // Prorate the difference
          },
        })

        // Update our local record
        await req.payload.update({
          collection: 'user-plans',
          id: userPlanDoc.id,
          data: {
            plan: targetPlan.id,
            metadata: updatedSubscription,
          },
        })

        return Response.json({
          action: 'subscription_updated',
          message: `Successfully changed to ${targetPlan.name}`,
          subscription: {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
          },
        })
      } catch (subscriptionError: any) {
        console.error('Failed to update subscription via Polar:', subscriptionError)

        // If subscription update fails, fall back to new checkout
        const checkout = await polar.checkouts.create({
          products: [targetPlan.polarProductId],
          successUrl,
          customerEmail: user.email,
          metadata: {
            userId: String(user.id),
            planId: String(targetPlan.id),
            planSlug: targetPlan.slug,
            replacesSubscription: userPlanDoc.externalSubscriptionId,
          },
        })

        return Response.json({
          action: 'checkout',
          checkoutUrl: checkout.url,
          checkoutId: checkout.id,
          note: 'Creating new subscription (will replace current)',
        })
      }
    } catch (error) {
      console.error('Polar upgrade error:', error)
      return Response.json({ error: 'Failed to process upgrade' }, { status: 500 })
    }
  },
}

/**
 * Cancel Subscription
 * POST /api/polar/cancel
 *
 * Cancels the user's active subscription
 */
export const polarCancelEndpoint: Endpoint = {
  path: '/polar/cancel',
  method: 'post',
  handler: async (req) => {
    try {
      const user = req.user
      if (!user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Get user's active subscription
      const userPlan = await req.payload.find({
        collection: 'user-plans',
        where: {
          user: { equals: user.id },
          status: { in: ['active', 'trialing'] },
          paymentProvider: { equals: 'polar' },
        },
        depth: 1,
        limit: 1,
      })

      if (userPlan.docs.length === 0) {
        return Response.json({ error: 'No active subscription found' }, { status: 404 })
      }

      const userPlanDoc = userPlan.docs[0]
      const currentPlan = typeof userPlanDoc.plan === 'object' ? userPlanDoc.plan : null

      // Can't cancel lifetime
      if (currentPlan?.billingCycle === 'lifetime') {
        return Response.json({
          error: 'Lifetime subscriptions cannot be cancelled',
        }, { status: 400 })
      }

      if (!userPlanDoc.externalSubscriptionId) {
        return Response.json({ error: 'No external subscription to cancel' }, { status: 400 })
      }

      const polar = getPolarClient()

      // Revoke subscription (cancel at period end - user keeps access until subscription expires)
      await polar.subscriptions.revoke({
        id: userPlanDoc.externalSubscriptionId,
      })

      // Update local record
      await req.payload.update({
        collection: 'user-plans',
        id: userPlanDoc.id,
        data: {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
        },
      })

      return Response.json({
        success: true,
        message: 'Subscription cancelled. You will retain access until the end of your billing period.',
      })
    } catch (error) {
      console.error('Polar cancel error:', error)
      return Response.json({ error: 'Failed to cancel subscription' }, { status: 500 })
    }
  },
}
