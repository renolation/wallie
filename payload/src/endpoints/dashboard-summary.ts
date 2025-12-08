import type { Endpoint } from 'payload'

/**
 * Calculate monthly equivalent from payment frequency
 */
function normalizeToMonthly(price: number, paymentEvery: number, frequency: string): number {
  const paymentsPerYear = getPaymentsPerYear(paymentEvery, frequency)
  return (price * paymentsPerYear) / 12
}

/**
 * Get number of payments per year based on frequency
 */
function getPaymentsPerYear(paymentEvery: number, frequency: string): number {
  switch (frequency) {
    case 'days':
      return 365 / paymentEvery
    case 'weeks':
      return 52 / paymentEvery
    case 'months':
      return 12 / paymentEvery
    case 'years':
      return 1 / paymentEvery
    default:
      return 12 // default to monthly
  }
}

/**
 * Dashboard Summary Endpoint
 * GET /api/dashboard/summary
 *
 * Returns aggregated stats for the user's home screen:
 * - Total subscriptions count
 * - Total monthly spend (normalized)
 * - Upcoming payments (next 7 days)
 * - Spend by category
 */
export const dashboardSummaryEndpoint: Endpoint = {
  path: '/dashboard/summary',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Get user's active subscriptions
      const subscriptions = await req.payload.find({
        collection: 'subscriptions',
        where: {
          owner: { equals: req.user.id },
        },
        depth: 1,
        limit: 1000,
      })

      const now = new Date()
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      // Calculate stats
      let totalMonthlySpend = 0
      const upcomingPayments: Array<{
        id: number
        name: string
        price: number
        currency: string
        nextPaymentDate: string
        daysUntil: number
        logoUrl?: string
      }> = []
      const spendByCategory: Record<string, { amount: number; count: number }> = {}

      for (const sub of subscriptions.docs) {
        // Normalize to monthly spend based on billing cycle
        const billingCycleToFreq: Record<string, string> = {
          daily: 'days',
          weekly: 'weeks',
          monthly: 'months',
          yearly: 'years',
        }
        const freq = billingCycleToFreq[sub.billingCycle || 'monthly'] || 'months'
        const monthlyAmount = normalizeToMonthly(
          sub.amount || 0,
          sub.frequency || 1,
          freq,
        )
        totalMonthlySpend += monthlyAmount

        // Check upcoming payments
        if (sub.nextBillingDate) {
          const nextPayment = new Date(sub.nextBillingDate)
          if (nextPayment >= now && nextPayment <= sevenDaysFromNow) {
            const daysUntil = Math.ceil(
              (nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            )
            upcomingPayments.push({
              id: sub.id,
              name: sub.name,
              price: sub.amount || 0,
              currency: sub.currency || 'USD',
              nextPaymentDate: sub.nextBillingDate,
              daysUntil,
              logoUrl: sub.logo || undefined,
            })
          }
        }

        // Aggregate by category
        const categoryName =
          typeof sub.category === 'object' ? sub.category?.name : 'Uncategorized'
        const catKey = categoryName || 'Uncategorized'
        if (!spendByCategory[catKey]) {
          spendByCategory[catKey] = { amount: 0, count: 0 }
        }
        spendByCategory[catKey].amount += monthlyAmount
        spendByCategory[catKey].count += 1
      }

      // Get all upcoming renewals (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const allUpcomingRenewals: Array<{
        id: number
        name: string
        price: number
        currency: string
        nextPaymentDate: string
        daysUntil: number
        logoUrl?: string
      }> = []

      for (const sub of subscriptions.docs) {
        if (sub.nextBillingDate) {
          const nextPayment = new Date(sub.nextBillingDate)
          if (nextPayment >= now && nextPayment <= thirtyDaysFromNow) {
            const daysUntil = Math.ceil(
              (nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            )
            allUpcomingRenewals.push({
              id: sub.id,
              name: sub.name,
              price: sub.amount || 0,
              currency: sub.currency || 'USD',
              nextPaymentDate: sub.nextBillingDate,
              daysUntil,
              logoUrl: sub.logo || undefined,
            })
          }
        }
      }

      // Sort upcoming payments by date
      upcomingPayments.sort((a, b) => a.daysUntil - b.daysUntil)
      allUpcomingRenewals.sort((a, b) => a.daysUntil - b.daysUntil)

      // Convert spend by category to array and sort
      const categoryBreakdown = Object.entries(spendByCategory)
        .map(([category, data]) => ({
          category,
          monthlyAmount: Math.round(data.amount * 100) / 100,
          count: data.count,
          percentage: totalMonthlySpend > 0 ? Math.round((data.amount / totalMonthlySpend) * 100) : 0,
        }))
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount)

      // Top category
      const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null

      // Next renewal
      const nextRenewal = allUpcomingRenewals.length > 0 ? allUpcomingRenewals[0] : null

      // Monthly spending trend (last 6 months)
      const monthlyTrend: Array<{ month: string; amount: number }> = []
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        monthlyTrend.push({
          month: monthNames[date.getMonth()],
          amount: Math.round(totalMonthlySpend * 100) / 100, // For now, use current monthly spend (historical data would require payment history)
        })
      }

      return Response.json({
        totalSubscriptions: subscriptions.totalDocs,
        activeSubscriptions: subscriptions.docs.filter((s) => s.autoRenew !== false).length,
        trialSubscriptions: subscriptions.docs.filter((s) => s.freeTrialEndDate && new Date(s.freeTrialEndDate) > now).length,
        totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
        totalYearlySpend: Math.round(totalMonthlySpend * 12 * 100) / 100,
        upcomingPaymentsCount: upcomingPayments.length,
        upcomingPayments: upcomingPayments.slice(0, 5), // Top 5 in next 7 days
        allUpcomingRenewals: allUpcomingRenewals.slice(0, 10), // Top 10 in next 30 days
        categoryBreakdown,
        topCategory,
        nextRenewal,
        monthlyTrend,
        currency: req.user.currency || 'USD',
      })
    } catch (error) {
      console.error('Dashboard summary error:', error)
      return Response.json({ error: 'Failed to generate dashboard summary' }, { status: 500 })
    }
  },
}
