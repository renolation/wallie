import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload'

type Frequency = 'days' | 'weeks' | 'months' | 'years'

/**
 * Calculate the next payment date based on paymentEvery and frequency
 */
function calculateNextPaymentDate(
  startDate: Date,
  paymentEvery: number,
  frequency: Frequency,
): Date {
  const now = new Date()
  const next = new Date(startDate)

  while (next <= now) {
    switch (frequency) {
      case 'days':
        next.setDate(next.getDate() + paymentEvery)
        break
      case 'weeks':
        next.setDate(next.getDate() + paymentEvery * 7)
        break
      case 'months':
        next.setMonth(next.getMonth() + paymentEvery)
        break
      case 'years':
        next.setFullYear(next.getFullYear() + paymentEvery)
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
  if (data.startDate && data.frequency && data.paymentEvery) {
    const start = new Date(data.startDate)
    const nextPayment = calculateNextPaymentDate(start, data.paymentEvery, data.frequency)
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
 * Format frequency for display (e.g., "1 months" -> "monthly", "2 weeks" -> "every 2 weeks")
 */
function formatFrequency(paymentEvery: number, frequency: Frequency): string {
  if (paymentEvery === 1) {
    switch (frequency) {
      case 'days':
        return 'daily'
      case 'weeks':
        return 'weekly'
      case 'months':
        return 'monthly'
      case 'years':
        return 'yearly'
    }
  }
  return `every ${paymentEvery} ${frequency}`
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
    const frequencyLabel = formatFrequency(doc.paymentEvery || 1, doc.frequency || 'months')

    await req.payload.create({
      collection: 'price-records',
      data: {
        subscription: doc.id,
        price: currentPrice,
        previousPrice: previousPrice,
        currency: doc.currency || 'USD',
        frequency: frequencyLabel,
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

/**
 * After change hook to create initial price record
 * Disabled: PostgreSQL transactions prevent this from working reliably in afterChange hooks.
 * Price records will be created on first price update instead.
 */
export const createInitialPriceRecordHook: CollectionAfterChangeHook = async ({
  doc,
}) => {
  // Disabled - PostgreSQL foreign key constraint fails because subscription
  // isn't committed yet within the same transaction
  return doc
}
