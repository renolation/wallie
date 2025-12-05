'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, MoreHorizontal, Loader2, ChevronDown, SortAsc } from 'lucide-react'
import { cn } from '@/lib/utils'
import AddSubscriptionModal from '../components/AddSubscriptionModal'

interface Subscription {
  id: number
  name: string
  logo?: string
  amount: number
  currency: string
  frequency: number
  billingCycle: string
  nextBillingDate?: string
  autoRenew: boolean
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', INR: '₹', KRW: '₩',
  BRL: 'R$', MXN: 'MX$', VND: '₫', THB: '฿', SGD: 'S$', CHF: 'Fr', CNY: '¥',
}

function getStatusColor(autoRenew: boolean): string {
  return autoRenew ? 'text-green-400' : 'text-yellow-400'
}

function getStatusLabel(autoRenew: boolean): string {
  return autoRenew ? 'Active' : 'Paused'
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions?depth=1', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSubscriptions(data.docs || [])
    } catch (err) {
      setError('Failed to load subscriptions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  const handleSubscriptionCreated = () => {
    fetchSubscriptions()
  }

  const formatPrice = (price: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency
    return `${symbol}${price.toFixed(2)}`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalMonthly = filteredSubscriptions.reduce((sum, sub) => {
    const price = sub.amount || 0
    if (sub.billingCycle === 'monthly') return sum + price
    if (sub.billingCycle === 'yearly') return sum + price / 12
    if (sub.billingCycle === 'weekly') return sum + price * 4.33
    return sum + price
  }, 0)

  const activeCount = filteredSubscriptions.filter(s => s.autoRenew).length
  const upcomingCount = filteredSubscriptions.filter(s => {
    if (!s.nextBillingDate) return false
    const days = Math.ceil((new Date(s.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days >= 0
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">{error}</div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-4xl font-black tracking-tight">Subscriptions</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border">
          <p className="text-muted-foreground text-base font-medium">Total Monthly Cost</p>
          <p className="text-3xl font-bold tracking-tight">{formatPrice(totalMonthly, 'USD')}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border">
          <p className="text-muted-foreground text-base font-medium">Active Subscriptions</p>
          <p className="text-3xl font-bold tracking-tight">{activeCount || filteredSubscriptions.length}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border">
          <p className="text-muted-foreground text-base font-medium">Upcoming Renewals</p>
          <p className="text-3xl font-bold tracking-tight">{upcomingCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="w-full md:flex-1">
          <div className="flex w-full items-center rounded-lg bg-muted h-12">
            <div className="flex items-center justify-center pl-4 text-muted-foreground">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none h-full px-4 text-base focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex h-12 items-center gap-2 rounded-lg bg-muted px-4 hover:bg-accent transition-colors">
            <span className="text-sm font-medium">Status</span>
            <ChevronDown className="w-5 h-5" />
          </button>
          <button className="flex h-12 items-center gap-2 rounded-lg bg-muted px-4 hover:bg-accent transition-colors">
            <SortAsc className="w-5 h-5" />
            <span className="text-sm font-medium">Sort by</span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Subscription Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubscriptions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-card text-center">
            <p className="text-muted-foreground mb-4">No subscriptions found. Add your first subscription!</p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Subscription
            </button>
          </div>
        ) : (
          filteredSubscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex flex-col gap-4 rounded-xl p-6 bg-card border border-border hover:border-primary/50 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {sub.logo ? (
                      <img
                        src={sub.logo}
                        alt={sub.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                          ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <span className={cn("text-lg font-bold", sub.logo && "hidden")}>
                      {sub.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{sub.name}</h3>
                    <p className={cn("text-sm font-medium", getStatusColor(sub.autoRenew))}>
                      {getStatusLabel(sub.autoRenew)}
                    </p>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatPrice(sub.amount || 0, sub.currency)}
                  <span className="text-muted-foreground text-base font-normal"> / {sub.billingCycle}</span>
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Renews on {formatDate(sub.nextBillingDate)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleSubscriptionCreated}
      />
    </div>
  )
}
