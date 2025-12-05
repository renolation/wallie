'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, TrendingUp } from 'lucide-react'
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
    { id: '1', name: 'Spotify', price: 9.99, renewalDate: 'tomorrow', logoUrl: '/logos/spotify.png' },
    { id: '2', name: 'Netflix', price: 15.49, renewalDate: 'in 3 days', logoUrl: '/logos/netflix.png' },
    { id: '3', name: 'Youtube Music', price: 12.99, renewalDate: 'in 12 days', logoUrl: '/logos/youtube.png' },
    { id: '4', name: 'Adobe CC', price: 54.99, renewalDate: 'in 15 days', logoUrl: '/logos/adobe.png' },
  ],
}

export default function DashboardPage() {
  const [stats] = useState<DashboardStats>(mockStats)
  const [searchQuery, setSearchQuery] = useState('')

  const maxAmount = Math.max(...stats.monthlyOverview.map(m => m.amount))
  const currentMonth = 'Apr'

  return (
    <div className="p-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Link
            href="/subscriptions/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Subscription
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6">
          <p className="text-base font-medium text-muted-foreground">Total Monthly Spending</p>
          <p className="text-3xl font-bold tracking-tight">${stats.totalMonthlySpending.toFixed(2)}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6">
          <p className="text-base font-medium text-muted-foreground">Active Subscriptions</p>
          <p className="text-3xl font-bold tracking-tight">{stats.activeSubscriptions}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6">
          <p className="text-base font-medium text-muted-foreground">Next Renewal</p>
          <p className="text-3xl font-bold tracking-tight">
            {stats.nextRenewal ? `${stats.nextRenewal.name} - In ${stats.nextRenewal.daysUntil} days` : 'None'}
          </p>
        </div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spending Chart */}
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Monthly Spending Overview</h2>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">$753.00</p>
            <p className="text-sm font-medium text-green-500 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +$21.50
            </p>
            <p className="text-sm text-muted-foreground">vs last 6 months</p>
          </div>
          <div className="mt-4 grid grid-cols-6 items-end gap-6 h-56 px-3">
            {stats.monthlyOverview.map((item) => {
              const height = (item.amount / maxAmount) * 100
              const isCurrentMonth = item.month === currentMonth
              return (
                <div key={item.month} className="flex h-full flex-col items-center justify-end gap-2">
                  <div
                    className={cn(
                      'w-4 rounded transition-all',
                      isCurrentMonth ? 'bg-primary' : 'bg-primary/30'
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <p className={cn(
                    'text-xs font-bold uppercase tracking-wider',
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {item.month}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold">Upcoming Renewals</h3>
          <div className="flex flex-col gap-4">
            {stats.upcomingRenewals.map((sub) => (
              <div key={sub.id} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                  {sub.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{sub.name}</p>
                  <p className="text-sm text-muted-foreground">Renews {sub.renewalDate}</p>
                </div>
                <p className="font-semibold">${sub.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <Link
            href="/subscriptions"
            className="mt-auto w-full rounded-lg border border-border py-2.5 text-center text-sm font-semibold hover:bg-accent transition-colors"
          >
            View All Subscriptions
          </Link>
        </div>
      </div>
    </div>
  )
}
