'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Wallet,
  Layers,
  BellRing,
  FolderOpen,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import AddSubscriptionModal from '@/app/(frontend)/components/AddSubscriptionModal'

interface UpcomingRenewal {
  id: number
  name: string
  price: number
  currency: string
  nextPaymentDate: string
  daysUntil: number
  logoUrl?: string
}

interface CategoryBreakdown {
  category: string
  monthlyAmount: number
  count: number
  percentage: number
}

interface DashboardData {
  totalSubscriptions: number
  activeSubscriptions: number
  trialSubscriptions: number
  totalMonthlySpend: number
  totalYearlySpend: number
  allUpcomingRenewals: UpcomingRenewal[]
  categoryBreakdown: CategoryBreakdown[]
  categoryColors: Record<string, string>
  topCategory: CategoryBreakdown | null
  nextRenewal: UpcomingRenewal | null
  monthlyTrend: { month: string; amount: number }[]
  currency: string
}

function formatRenewalDate(daysUntil: number): string {
  if (daysUntil === 0) return 'Today'
  if (daysUntil === 1) return 'Tomorrow'
  return `In ${daysUntil} days`
}

interface DashboardClientProps {
  initialData: DashboardData
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const data = initialData

  const maxChartAmount = Math.max(...(data.monthlyTrend.map((m) => m.amount) || [1]), 1)
  const currentMonth = data.monthlyTrend[data.monthlyTrend.length - 1]?.month

  // Calculate max for category chart
  const maxCategoryAmount = Math.max(...(data.categoryBreakdown.map((c) => c.monthlyAmount) || [1]), 1)

  return (
    <div className="p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Subscription
          </Button>
        </div>
      </header>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Monthly Spending */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Monthly Spending</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              ${data.totalMonthlySpend.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ${data.totalYearlySpend.toFixed(2)}/year
            </p>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Layers className="w-4 h-4 text-primary" />
              <span>Active Subscriptions</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{data.activeSubscriptions}</p>
            {data.trialSubscriptions > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {data.trialSubscriptions} on free trial
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <FolderOpen className="w-4 h-4 text-primary" />
              <span>Top Category</span>
            </div>
            {data.topCategory ? (
              <>
                <p className="text-2xl font-bold tracking-tight">{data.topCategory.category}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${data.topCategory.monthlyAmount.toFixed(2)}/mo ({data.topCategory.count} subs)
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold tracking-tight text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>

        {/* Next Renewal */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <BellRing className="w-4 h-4 text-primary" />
              <span>Next Renewal</span>
            </div>
            {data.nextRenewal ? (
              <>
                <p className="text-2xl font-bold tracking-tight truncate">{data.nextRenewal.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRenewalDate(data.nextRenewal.daysUntil)} · ${data.nextRenewal.price.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold tracking-tight text-muted-foreground">No upcoming</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Monthly Spending Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold">Monthly Spending Overview</p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold tracking-tight">${data.totalYearlySpend.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">per year</p>
              </div>
            </div>
            <div className="mt-auto grid min-h-[180px] grid-flow-col items-end justify-items-center gap-4 px-3">
              {data.monthlyTrend.map((item, index) => {
                const height = maxChartAmount > 0 ? (item.amount / maxChartAmount) * 100 : 0
                const isCurrentMonth = item.month === currentMonth
                return (
                  <div
                    key={index}
                    className="flex h-full w-full flex-col items-center justify-end gap-2 group"
                  >
                    <div
                      className={cn(
                        'w-full max-w-[24px] rounded-t-sm transition-all',
                        isCurrentMonth
                          ? 'bg-primary shadow-[0_0_10px_rgba(0,173,181,0.2)]'
                          : 'bg-primary/20 group-hover:bg-primary/30',
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <p
                      className={cn(
                        'text-xs font-medium uppercase tracking-wider transition-colors',
                        isCurrentMonth
                          ? 'text-primary font-bold'
                          : 'text-muted-foreground group-hover:text-primary',
                      )}
                    >
                      {item.month}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card>
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Upcoming Renewals</h3>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {data.allUpcomingRenewals.length > 0 ? (
                data.allUpcomingRenewals.slice(0, 5).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted group-hover:bg-muted/80 transition-colors overflow-hidden">
                      {sub.logoUrl ? (
                        <img
                          src={sub.logoUrl}
                          alt={sub.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                            ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <span className={cn('text-xs font-bold', sub.logoUrl && 'hidden')}>
                        {sub.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{sub.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatRenewalDate(sub.daysUntil)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">${sub.price.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No upcoming renewals</p>
                </div>
              )}
            </div>
            <Link href="/calendar" className="block mt-4">
              <Button variant="outline" className="w-full">
                View Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Spending by Category */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Spending by Category</h3>
            <p className="text-sm text-muted-foreground">
              {data.categoryBreakdown.length} categories
            </p>
          </div>
          {data.categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {data.categoryBreakdown.map((cat) => {
                const width = maxCategoryAmount > 0 ? (cat.monthlyAmount / maxCategoryAmount) * 100 : 0
                const color = data.categoryColors[cat.category] || data.categoryColors.Uncategorized || '#6B7280'
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-muted-foreground">({cat.count})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${cat.monthlyAmount.toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs w-10 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${width}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                No subscriptions yet. Add one to see your spending breakdown.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          router.refresh()
        }}
      />
    </div>
  )
}
