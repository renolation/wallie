import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload'

/**
 * Calculate the next payment date based on the billing cycle
 */
function calculateNextPaymentDate(
  firstPaymentDate: Date,
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
): Date {
  const now = new Date()
  const next = new Date(firstPaymentDate)

  while (next <= now) {
    switch (billingCycle) {
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
      case 'quarterly':
        next.setMonth(next.getMonth() + 3)
        break
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1)
        break
    }
  }

  return next
}

/**
 * Before change hook to calculate next payment date
 */
export const calculateNextPaymentDateHook: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  // Only calculate if we have the required fields
  if (data.firstPaymentDate && data.billingCycle) {
    const firstPayment = new Date(data.firstPaymentDate)
    const nextPayment = calculateNextPaymentDate(firstPayment, data.billingCycle)
    data.nextPaymentDate = nextPayment.toISOString()
  }

  // Reset notification flag if billing cycle is about to reset
  if (operation === 'update' && originalDoc) {
    const oldNextPayment = originalDoc.nextPaymentDate
      ? new Date(originalDoc.nextPaymentDate)
      : null
    const newNextPayment = data.nextPaymentDate ? new Date(data.nextPaymentDate) : null

    // If next payment date changed (new cycle), reset notification flag
    if (
      oldNextPayment &&
      newNextPayment &&
      oldNextPayment.getTime() !== newNextPayment.getTime()
    ) {
      data.notifiedForCurrentCycle = false
    }
  }

  return data
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

    await req.payload.create({
      collection: 'price-records',
      data: {
        subscription: doc.id,
        price: currentPrice,
        previousPrice: previousPrice,
        currency: doc.currency || 'USD',
        billingCycle: doc.billingCycle,
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
            body: `The price of ${doc.name} has increased from $${(previousPrice / 100).toFixed(2)} to $${(currentPrice / 100).toFixed(2)} (${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1)}%)`,
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

/**
 * After change hook to create initial price record
 */
export const createInitialPriceRecordHook: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  // Only on create
  if (operation !== 'create') return doc

  await req.payload.create({
    collection: 'price-records',
    data: {
      subscription: doc.id,
      price: doc.price,
      currency: doc.currency || 'USD',
      billingCycle: doc.billingCycle,
      recordedAt: new Date().toISOString(),
      source: doc.source === 'manual' ? 'user_update' : 'import',
    },
  })

  return doc
}
