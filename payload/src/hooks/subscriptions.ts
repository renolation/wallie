import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload'

type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'yearly'

/**
 * Calculate the next billing date based on repeatEvery and billingCycle
 */
function calculateNextBillingDate(
  startDate: Date,
  repeatEvery: number,
  billingCycle: BillingCycle,
): Date {
  const now = new Date()
  const next = new Date(startDate)

  while (next <= now) {
    switch (billingCycle) {
      case 'daily':
        next.setDate(next.getDate() + repeatEvery)
        break
      case 'weekly':
        next.setDate(next.getDate() + repeatEvery * 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + repeatEvery)
        break
      case 'yearly':
        next.setFullYear(next.getFullYear() + repeatEvery)
        break
    }
  }

  return next
}

/**
 * Before change hook to calculate next billing date
 */
export const calculateNextPaymentDateHook: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  // Only calculate if we have the required fields
  if (data.startDate && data.billingCycle && data.repeatEvery) {
    const start = new Date(data.startDate)
    const nextBilling = calculateNextBillingDate(start, data.repeatEvery, data.billingCycle)
    data.nextBillingDate = nextBilling.toISOString()
  }

  // Reset notification flag if billing cycle is about to reset
  if (operation === 'update' && originalDoc) {
    const oldNextBilling = originalDoc.nextBillingDate
      ? new Date(originalDoc.nextBillingDate)
      : null
    const newNextBilling = data.nextBillingDate ? new Date(data.nextBillingDate) : null

    // If next billing date changed (new cycle), reset notification flag
    if (
      oldNextBilling &&
      newNextBilling &&
      oldNextBilling.getTime() !== newNextBilling.getTime()
    ) {
      data.notifiedForCurrentCycle = false
    }
  }

  return data
}

/**
 * Format billing cycle for display
 */
function formatBillingCycle(repeatEvery: number, billingCycle: BillingCycle): string {
  if (repeatEvery === 1) {
    return billingCycle // daily, weekly, monthly, yearly
  }
  const cycleMap: Record<BillingCycle, string> = {
    daily: 'days',
    weekly: 'weeks',
    monthly: 'months',
    yearly: 'years',
  }
  return `every ${repeatEvery} ${cycleMap[billingCycle]}`
}

/**
 * After change hook to record price changes
 */
export const recordPriceChangeHook: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Only track price changes on updates
  if (operation !== 'update' || !previousDoc) return doc

  const previousPrice = previousDoc.price
  const currentPrice = doc.price

  // If price changed, record it
  if (previousPrice !== currentPrice && previousPrice !== undefined) {
    const changePercentage = ((currentPrice - previousPrice) / previousPrice) * 100
    const billingCycleLabel = formatBillingCycle(doc.repeatEvery || 1, doc.billingCycle || 'monthly')

    await req.payload.create({
      collection: 'price-records',
      data: {
        subscription: doc.id,
        price: currentPrice,
        previousPrice: previousPrice,
        currency: doc.currency || 'USD',
        frequency: billingCycleLabel,
        recordedAt: new Date().toISOString(),
        source: 'user_update',
        changePercentage: Math.round(changePercentage * 100) / 100,
      },
    })

    // Create notification for price change if it's an increase
    if (currentPrice > previousPrice) {
      const user = typeof doc.user === 'string' ? doc.user : doc.user?.id
      if (user) {
        await req.payload.create({
          collection: 'notifications',
          data: {
            user,
            type: 'price_change',
            title: `${doc.name} price increased`,
            body: `The price of ${doc.name} has increased from ${doc.currency} ${previousPrice} to ${doc.currency} ${currentPrice} (${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1)}%)`,
            subscription: doc.id,
            status: 'pending',
            priority: 'high',
            channels: ['push', 'in_app'],
          },
        })
      }
    }
  }

  return doc
}
