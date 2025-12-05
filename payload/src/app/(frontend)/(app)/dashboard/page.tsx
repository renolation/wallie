'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Wallet, Layers, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Subscription {
  id: string
  name: string
  price: number
  renewalDate: string
  logoUrl?: string
}

interface DashboardStats {
  totalMonthlySpending: number
  activeSubscriptions: number
  nextRenewal: { name: string; daysUntil: number } | null
  monthlyOverview: { month: string; amount: number }[]
  upcomingRenewals: Subscription[]
}

const mockStats: DashboardStats = {
  totalMonthlySpending: 125.50,
  activeSubscriptions: 12,
  nextRenewal: { name: 'Netflix', daysUntil: 3 },
  monthlyOverview: [
    { month: 'Jan', amount: 110 },
    { month: 'Feb', amount: 95 },
    { month: 'Mar', amount: 130 },
    { month: 'Apr', amount: 145 },
    { month: 'May', amount: 105 },
    { month: 'Jun', amount: 125 },
  ],
  upcomingRenewals: [
    { id: '1', name: 'Spotify', price: 9.99, renewalDate: 'tomorrow' },
    { id: '2', name: 'Netflix', price: 15.49, renewalDate: 'in 3 days' },
    { id: '3', name: 'Youtube Music', price: 12.99, renewalDate: 'in 12 days' },
    { id: '4', name: 'Adobe CC', price: 54.99, renewalDate: 'in 15 days' },
  ],
}

export default function DashboardPage() {
  const [stats] = useState<DashboardStats>(mockStats)
  const [searchQuery, setSearchQuery] = useState('')

  const maxAmount = Math.max(...stats.monthlyOverview.map(m => m.amount))
  const currentMonth = 'Apr'

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
          <Link href="/subscriptions">
            <Button>
              <Plus className="w-4 h-4" />
              Add Subscription
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Total Monthly Spending</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">${stats.totalMonthlySpending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Layers className="w-4 h-4 text-primary" />
              <span>Active Subscriptions</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats.activeSubscriptions}</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <BellRing className="w-4 h-4 text-primary" />
              <span>Next Renewal</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {stats.nextRenewal ? `${stats.nextRenewal.name} - In ${stats.nextRenewal.daysUntil} days` : 'None'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Spending Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-semibold">Monthly Spending Overview</p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold tracking-tight">$753.00</p>
                <p className="text-xs font-medium text-green-500">+$21.50</p>
                <p className="text-xs text-muted-foreground">vs last 6 mo</p>
              </div>
            </div>
            <div className="mt-auto grid min-h-[180px] grid-flow-col items-end justify-items-center gap-4 px-3">
              {stats.monthlyOverview.map((item) => {
                const height = (item.amount / maxAmount) * 100
                const isCurrentMonth = item.month === currentMonth
                return (
                  <div key={item.month} className="flex h-full w-full flex-col items-center justify-end gap-2 group">
                    <div
                      className={cn(
                        'w-full max-w-[20px] rounded-t-sm transition-all',
                        isCurrentMonth
                          ? 'bg-primary shadow-[0_0_10px_rgba(0,173,181,0.2)]'
                          : 'bg-primary/20 group-hover:bg-primary/30'
                      )}
                      style={{ height: `${height}%` }}
                    />
                    <p className={cn(
                      'text-xs font-medium uppercase tracking-wider transition-colors',
                      isCurrentMonth ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-primary'
                    )}>
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
            <h3 className="text-base font-semibold mb-3">Upcoming Renewals</h3>
            <div className="flex flex-col gap-2 flex-1">
              {stats.upcomingRenewals.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted group-hover:bg-muted/80 transition-colors">
                    <span className="text-xs font-bold">{sub.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{sub.name}</p>
                    <p className="truncate text-xs text-muted-foreground">Renews {sub.renewalDate}</p>
                  </div>
                  <p className="text-sm font-semibold">${sub.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <Link href="/subscriptions" className="block mt-4">
              <Button variant="outline" className="w-full">View All Subscriptions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
