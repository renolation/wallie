import type { Payload } from 'payload'
import { calculateNextBillingDate, type BillingCycle } from '../lib/billing'

/**
 * Check for upcoming subscription renewals and create notifications
 * This should be called periodically (e.g., hourly via cron)
 */
export async function checkRenewalNotifications(payload: Payload): Promise<{
  processed: number
  notificationsCreated: number
}> {
  let processed = 0
  let notificationsCreated = 0

  try {
    // Calculate the target date range (3 days from now)
    const reminderDays = 3
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + reminderDays)
    targetDate.setHours(0, 0, 0, 0)

    const targetDateEnd = new Date(targetDate)
    targetDateEnd.setHours(23, 59, 59, 999)

    // Find subscriptions with upcoming billing dates
    const subscriptions = await payload.find({
      collection: 'subscriptions',
      where: {
        nextBillingDate: {
          greater_than_equal: targetDate.toISOString(),
          less_than_equal: targetDateEnd.toISOString(),
        },
        autoRenew: { equals: true },
      },
      depth: 1,
      limit: 100,
    })

    for (const sub of subscriptions.docs) {
      processed++

      if (!sub.owner) continue
      const userId = typeof sub.owner === 'object' ? sub.owner.id : sub.owner

      // Check if notification already exists for this subscription
      const existingNotification = await payload.find({
        collection: 'notifications',
        where: {
          user: { equals: userId },
          subscription: { equals: sub.id },
          notificationDate: {
            greater_than_equal: targetDate.toISOString(),
          },
        },
        limit: 1,
      })

      if (existingNotification.totalDocs > 0) {
        continue // Already notified
      }

      const priceFormatted = (sub.amount || 0).toFixed(2)
      const currency = sub.currency || 'USD'

      // Create notification
      await payload.create({
        collection: 'notifications',
        data: {
          user: userId,
          subscription: sub.id,
          notificationDate: targetDate.toISOString(),
          message: `Your ${sub.name} subscription (${currency} ${priceFormatted}) will renew on ${new Date(sub.nextBillingDate!).toLocaleDateString()}.`,
          method: 'push',
          sent: false,
        },
      })

      notificationsCreated++
    }

    return { processed, notificationsCreated }
  } catch (error) {
    console.error('Renewal notification check error:', error)
    throw error
  }
}

/**
 * Check for ending trials and create notifications
 */
export async function checkTrialEndingNotifications(payload: Payload): Promise<{
  processed: number
  notificationsCreated: number
}> {
  let processed = 0
  let notificationsCreated = 0

  try {
    // Find trials ending in 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    threeDaysFromNow.setHours(0, 0, 0, 0)

    const threeDaysEnd = new Date(threeDaysFromNow)
    threeDaysEnd.setHours(23, 59, 59, 999)

    const trialSubscriptions = await payload.find({
      collection: 'subscriptions',
      where: {
        freeTrialEndDate: {
          greater_than_equal: threeDaysFromNow.toISOString(),
          less_than_equal: threeDaysEnd.toISOString(),
        },
      },
      depth: 1,
      limit: 100,
    })

    for (const sub of trialSubscriptions.docs) {
      processed++

      if (!sub.owner) continue
      const userId = typeof sub.owner === 'object' ? sub.owner.id : sub.owner

      // Check if notification already exists
      const existingNotification = await payload.find({
        collection: 'notifications',
        where: {
          user: { equals: userId },
          subscription: { equals: sub.id },
          notificationDate: {
            greater_than_equal: threeDaysFromNow.toISOString(),
          },
        },
        limit: 1,
      })

      if (existingNotification.totalDocs > 0) {
        continue
      }

      const currency = sub.currency || 'USD'

      await payload.create({
        collection: 'notifications',
        data: {
          user: userId,
          subscription: sub.id,
          notificationDate: threeDaysFromNow.toISOString(),
          message: `Your free trial for ${sub.name} ends soon. After the trial, you'll be charged ${currency} ${sub.amount || 0} ${sub.billingCycle || 'monthly'}.`,
          method: 'push',
          sent: false,
        },
      })

      notificationsCreated++
    }

    return { processed, notificationsCreated }
  } catch (error) {
    console.error('Trial ending notification check error:', error)
    throw error
  }
}

/**
 * Update expired renewal dates for subscriptions
 * Finds subscriptions where nextBillingDate is in the past and advances them
 * using their billingCycle and frequency values.
 * This should be called daily via cron.
 */
export async function updateExpiredRenewalDates(payload: Payload): Promise<{
  processed: number
  updated: number
}> {
  let processed = 0
  let updated = 0

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find subscriptions with past billing dates that have autoRenew enabled
    const expiredSubscriptions = await payload.find({
      collection: 'subscriptions',
      where: {
        nextBillingDate: {
          less_than: today.toISOString(),
        },
        autoRenew: { equals: true },
      },
      limit: 500,
    })

    for (const sub of expiredSubscriptions.docs) {
      processed++

      if (!sub.nextBillingDate || !sub.billingCycle) {
        continue
      }

      const billingCycle = sub.billingCycle as BillingCycle
      const frequency = sub.frequency || 1
      const currentNextDate = new Date(sub.nextBillingDate)

      // Calculate the new next billing date
      const newNextBillingDate = calculateNextBillingDate(
        currentNextDate,
        billingCycle,
        frequency,
      )

      // Update the subscription
      await payload.update({
        collection: 'subscriptions',
        id: sub.id,
        data: {
          nextBillingDate: newNextBillingDate.toISOString(),
        },
      })

      updated++
    }

    return { processed, updated }
  } catch (error) {
    console.error('Update expired renewal dates error:', error)
    throw error
  }
}
