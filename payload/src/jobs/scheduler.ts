import cron from 'node-cron'
import type { Payload } from 'payload'
import {
  updateExpiredRenewalDates,
  checkRenewalNotifications,
  checkTrialEndingNotifications,
} from './renewal-notifications'

let isSchedulerInitialized = false

/**
 * Initialize the cron scheduler for background jobs
 * Runs once a day at midnight (00:00)
 */
export function initScheduler(payload: Payload): void {
  if (isSchedulerInitialized) {
    return
  }

  // Run daily at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily renewal jobs...')

    try {
      // Update expired renewal dates first
      const renewalDatesResult = await updateExpiredRenewalDates(payload)
      console.log(`[Scheduler] Renewal dates updated: ${renewalDatesResult.updated}/${renewalDatesResult.processed}`)

      // Check for upcoming renewals and create notifications
      const renewalResult = await checkRenewalNotifications(payload)
      console.log(`[Scheduler] Renewal notifications created: ${renewalResult.notificationsCreated}`)

      // Check for ending trials
      const trialResult = await checkTrialEndingNotifications(payload)
      console.log(`[Scheduler] Trial notifications created: ${trialResult.notificationsCreated}`)

      console.log('[Scheduler] Daily jobs completed successfully')
    } catch (error) {
      console.error('[Scheduler] Error running daily jobs:', error)
    }
  })

  isSchedulerInitialized = true
  console.log('[Scheduler] Initialized - daily jobs scheduled at 00:00')
}
