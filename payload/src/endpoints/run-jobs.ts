import type { Endpoint } from 'payload'
import {
  checkRenewalNotifications,
  checkTrialEndingNotifications,
  updateExpiredRenewalDates,
} from '../jobs/renewal-notifications'

/**
 * Run Jobs Endpoint
 * POST /api/jobs/notifications
 *
 * Triggers notification jobs. Should be called by a cron service.
 * Requires either admin user or a secret header for security.
 */
export const runNotificationJobsEndpoint: Endpoint = {
  path: '/jobs/notifications',
  method: 'post',
  handler: async (req) => {
    // Security: require admin user OR cron secret
    const cronSecret = req.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET

    const isAdmin = req.user?.roles?.includes('admin')
    const hasValidSecret = expectedSecret && cronSecret === expectedSecret

    if (!isAdmin && !hasValidSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // First, update any expired renewal dates
      const renewalDatesResult = await updateExpiredRenewalDates(req.payload)

      // Then check for upcoming renewals and create notifications
      const renewalResult = await checkRenewalNotifications(req.payload)
      const trialResult = await checkTrialEndingNotifications(req.payload)

      return Response.json({
        success: true,
        timestamp: new Date().toISOString(),
        results: {
          renewalDatesUpdated: renewalDatesResult,
          renewalNotifications: renewalResult,
          trialNotifications: trialResult,
        },
      })
    } catch (error) {
      console.error('Job execution error:', error)
      return Response.json(
        {
          error: 'Job execution failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      )
    }
  },
}
