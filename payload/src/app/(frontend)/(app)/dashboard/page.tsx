import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import DashboardClient from './client'

interface CategoryData {
  amount: number
  count: number
}

function normalizeToMonthly(price: number, paymentEvery: number, frequency: string): number {
  const paymentsPerYear = getPaymentsPerYear(paymentEvery, frequency)
  return (price * paymentsPerYear) / 12
}

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
      return 12
  }
}

export default async function DashboardPage() {
  const payload = await getPayload({ config })

  // Get user from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your dashboard</p>
      </div>
    )
  }

  // Verify user
  let user
  try {
    const authResult = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
    user = authResult.user
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your dashboard</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your dashboard</p>
      </div>
    )
  }

  // Fetch subscriptions using local API
  const subscriptions = await payload.find({
    collection: 'subscriptions',
    where: {
      owner: { equals: user.id },
    },
    depth: 1,
    limit: 1000,
  })

  // Fetch categories to get colors
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
  })

  // Build category color map
  const categoryColors: Record<string, string> = { Uncategorized: '#6B7280' }
  for (const cat of categories.docs) {
    if (cat.name && cat.color) {
      categoryColors[cat.name] = cat.color
    }
  }

  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  // Calculate stats
  let totalMonthlySpend = 0
  const spendByCategory: Record<string, CategoryData> = {}
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
    // Normalize to monthly spend
    const billingCycleToFreq: Record<string, string> = {
      daily: 'days',
      weekly: 'weeks',
      monthly: 'months',
      yearly: 'years',
    }
    const freq = billingCycleToFreq[sub.billingCycle || 'monthly'] || 'months'
    const monthlyAmount = normalizeToMonthly(sub.amount || 0, sub.frequency || 1, freq)
    totalMonthlySpend += monthlyAmount

    // Aggregate by category
    const categoryName = typeof sub.category === 'object' ? sub.category?.name : 'Uncategorized'
    const catKey = categoryName || 'Uncategorized'
    if (!spendByCategory[catKey]) {
      spendByCategory[catKey] = { amount: 0, count: 0 }
    }
    spendByCategory[catKey].amount += monthlyAmount
    spendByCategory[catKey].count += 1

    // Check upcoming renewals (next 30 days)
    if (sub.nextBillingDate) {
      const nextPayment = new Date(sub.nextBillingDate)
      if (nextPayment >= now && nextPayment <= thirtyDaysFromNow) {
        const daysUntil = Math.ceil((nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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

  // Sort upcoming renewals by date
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
      amount: Math.round(totalMonthlySpend * 100) / 100,
    })
  }

  const dashboardData = {
    totalSubscriptions: subscriptions.totalDocs,
    activeSubscriptions: subscriptions.docs.filter((s) => s.autoRenew !== false).length,
    trialSubscriptions: subscriptions.docs.filter(
      (s) => s.freeTrialEndDate && new Date(s.freeTrialEndDate) > now
    ).length,
    totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
    totalYearlySpend: Math.round(totalMonthlySpend * 12 * 100) / 100,
    allUpcomingRenewals: allUpcomingRenewals.slice(0, 10),
    categoryBreakdown,
    categoryColors,
    topCategory,
    nextRenewal,
    monthlyTrend,
    currency: user.currency || 'USD',
  }

  return <DashboardClient initialData={dashboardData} />
}
