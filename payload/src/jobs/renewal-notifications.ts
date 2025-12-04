import type { Payload } from 'payload'

/**
 * Format frequency for display
 */
function formatFrequency(paymentEvery: number, frequency: string): string {
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
    // Get all users with their notification preferences
    const users = await payload.find({
      collection: 'users',
      where: {
        'notificationPreferences.renewalReminders': { equals: true },
      },
      limit: 1000,
    })

    for (const user of users.docs) {
      const reminderDays = user.notificationPreferences?.reminderDaysBefore || 3

      // Calculate the target date range
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + reminderDays)
      targetDate.setHours(0, 0, 0, 0)

      const targetDateEnd = new Date(targetDate)
      targetDateEnd.setHours(23, 59, 59, 999)

      // Find subscriptions due on the reminder day that haven't been notified
      const subscriptions = await payload.find({
        collection: 'subscriptions',
        where: {
          user: { equals: user.id },
          status: { equals: 'active' },
          notifiedForCurrentCycle: { equals: false },
          nextPaymentDate: {
            greater_than_equal: targetDate.toISOString(),
            less_than_equal: targetDateEnd.toISOString(),
          },
        },
        limit: 100,
      })

      for (const sub of subscriptions.docs) {
        processed++

        // Check if notification already exists for this subscription
        const existingNotification = await payload.find({
          collection: 'notifications',
          where: {
            user: { equals: user.id },
            subscription: { equals: sub.id },
            type: { equals: 'renewal_reminder' },
            status: { in: ['pending', 'sent'] },
          },
          limit: 1,
        })

        if (existingNotification.totalDocs > 0) {
          continue // Already notified
        }

        // Create notification
        const priceFormatted = (sub.price / 100).toFixed(2)
        const currency = sub.currency || 'USD'

        await payload.create({
          collection: 'notifications',
          data: {
            user: user.id,
            type: 'renewal_reminder',
            title: `${sub.name} renews in ${reminderDays} days`,
            body: `Your ${sub.name} subscription (${currency} ${priceFormatted}) will renew on ${new Date(sub.nextPaymentDate!).toLocaleDateString()}.`,
            subscription: sub.id,
            status: 'pending',
            priority: 'normal',
            channels: ['push', 'in_app'],
            actionUrl: `/subscriptions/${sub.id}`,
          },
        })

        // Mark subscription as notified for this cycle
        await payload.update({
          collection: 'subscriptions',
          id: sub.id,
          data: {
            notifiedForCurrentCycle: true,
          },
        })

        notificationsCreated++
      }
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
        status: { equals: 'trial' },
        trialEndDate: {
          greater_than_equal: threeDaysFromNow.toISOString(),
          less_than_equal: threeDaysEnd.toISOString(),
        },
      },
      depth: 1,
      limit: 100,
    })

    for (const sub of trialSubscriptions.docs) {
      processed++

      if (!sub.user) continue
      const userId = typeof sub.user === 'object' ? sub.user.id : sub.user

      // Check if notification already exists
      const existingNotification = await payload.find({
        collection: 'notifications',
        where: {
          user: { equals: userId },
          subscription: { equals: sub.id },
          type: { equals: 'trial_ending' },
          status: { in: ['pending', 'sent'] },
        },
        limit: 1,
      })

      if (existingNotification.totalDocs > 0) {
        continue
      }

      const currency = sub.currency || 'USD'
      const frequencyLabel = formatFrequency(sub.paymentEvery || 1, sub.frequency || 'months')

      await payload.create({
        collection: 'notifications',
        data: {
          user: userId,
          type: 'trial_ending',
          title: `${sub.name} trial ends in 3 days`,
          body: `Your free trial for ${sub.name} ends soon. After the trial, you'll be charged ${currency} ${sub.price} ${frequencyLabel}.`,
          subscription: sub.id,
          status: 'pending',
          priority: 'high',
          channels: ['push', 'email', 'in_app'],
          actionUrl: `/subscriptions/${sub.id}`,
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
