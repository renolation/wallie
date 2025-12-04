import type { Endpoint } from 'payload'

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
          user: { equals: req.user.id },
          status: { in: ['active', 'trial'] },
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
        nextPaymentDate: string
        daysUntil: number
      }> = []
      const spendByCategory: Record<string, number> = {}

      for (const sub of subscriptions.docs) {
        // Normalize to monthly spend (price is in cents)
        let monthlyAmount = sub.price
        switch (sub.billingCycle) {
          case 'weekly':
            monthlyAmount = sub.price * 4.33 // Average weeks per month
            break
          case 'quarterly':
            monthlyAmount = sub.price / 3
            break
          case 'yearly':
            monthlyAmount = sub.price / 12
            break
          // monthly stays as is
        }
        totalMonthlySpend += monthlyAmount

        // Check upcoming payments
        if (sub.nextPaymentDate) {
          const nextPayment = new Date(sub.nextPaymentDate)
          if (nextPayment >= now && nextPayment <= sevenDaysFromNow) {
            const daysUntil = Math.ceil(
              (nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            )
            upcomingPayments.push({
              id: sub.id,
              name: sub.name,
              price: sub.price,
              nextPaymentDate: sub.nextPaymentDate,
              daysUntil,
            })
          }
        }

        // Aggregate by category
        const categoryName =
          typeof sub.category === 'object' ? sub.category?.name : 'Uncategorized'
        const catKey = categoryName || 'Uncategorized'
        spendByCategory[catKey] = (spendByCategory[catKey] || 0) + monthlyAmount
      }

      // Sort upcoming payments by date
      upcomingPayments.sort((a, b) => a.daysUntil - b.daysUntil)

      // Convert spend by category to array and sort
      const categoryBreakdown = Object.entries(spendByCategory)
        .map(([category, amount]) => ({
          category,
          monthlyAmount: Math.round(amount),
          percentage: totalMonthlySpend > 0 ? Math.round((amount / totalMonthlySpend) * 100) : 0,
        }))
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount)

      return Response.json({
        totalSubscriptions: subscriptions.totalDocs,
        activeSubscriptions: subscriptions.docs.filter((s) => s.status === 'active').length,
        trialSubscriptions: subscriptions.docs.filter((s) => s.status === 'trial').length,
        totalMonthlySpend: Math.round(totalMonthlySpend), // in cents
        totalYearlySpend: Math.round(totalMonthlySpend * 12), // in cents
        upcomingPaymentsCount: upcomingPayments.length,
        upcomingPayments: upcomingPayments.slice(0, 5), // Top 5
        categoryBreakdown,
        currency: req.user.currency || 'USD',
      })
    } catch (error) {
      console.error('Dashboard summary error:', error)
      return Response.json({ error: 'Failed to generate dashboard summary' }, { status: 500 })
    }
  },
}
