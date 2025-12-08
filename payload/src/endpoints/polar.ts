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
      paymentProvider: 'polar',
      externalSubscriptionId: data.subscription_id || data.id,
      externalCustomerId: data.customer_id,
      metadata: data,
    },
  })

  console.log(`Created user plan for user ${userId}`)
}

async function handleSubscriptionActive(payload: any, data: any) {
  console.log('handleSubscriptionActive called')

  const customerId = data.customer_id
  const subscriptionId = data.id
  const metadata = data.metadata || {}
  const userId = metadata.userId || metadata.user_id
  const planId = metadata.planId || metadata.plan_id

  console.log('Subscription data - userId:', userId, 'planId:', planId, 'customerId:', customerId)

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
        expiresAt: data.current_period_end || null,
        paymentProvider: 'polar',
        externalSubscriptionId: subscriptionId,
        externalCustomerId: customerId,
        metadata: data,
      },
    })
    console.log(`Created user plan for user ${userId} from subscription.active`)
  } else {
    console.log('No metadata found in subscription.active, cannot create plan')
  }
}

async function handleSubscriptionUpdated(payload: any, data: any) {
  const subscriptionId = data.id

  const existingPlan = await payload.find({
    collection: 'user-plans',
    where: {
      externalSubscriptionId: { equals: subscriptionId },
    },
    limit: 1,
  })

  if (existingPlan.docs.length > 0) {
    const status = mapPolarStatus(data.status)
    await payload.update({
      collection: 'user-plans',
      id: existingPlan.docs[0].id,
      data: {
        status,
        expiresAt: data.current_period_end || data.ended_at,
        metadata: data,
      },
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
