'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, MoreHorizontal, Loader2, ListFilter, ArrowUpDown, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import AddSubscriptionModal from '../../components/AddSubscriptionModal'

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

type SubscriptionStatus = 'active' | 'expiring' | 'canceled'

function getSubscriptionStatus(sub: Subscription): SubscriptionStatus {
  if (!sub.autoRenew) return 'canceled'
  if (sub.nextBillingDate) {
    const days = Math.ceil((new Date(sub.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days <= 7 && days >= 0) return 'expiring'
  }
  return 'active'
}

function getStatusBadge(status: SubscriptionStatus) {
  switch (status) {
    case 'active':
      return <Badge variant="success" className="gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />Active</Badge>
    case 'expiring':
      return <Badge variant="warning" className="gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" />Expiring Soon</Badge>
    case 'canceled':
      return <Badge variant="destructive" className="gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Canceled</Badge>
  }
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
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm font-medium">Total Monthly Cost</p>
            <p className="text-2xl font-bold tracking-tight">{formatPrice(totalMonthly, 'USD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm font-medium">Active Subscriptions</p>
            <p className="text-2xl font-bold tracking-tight">{activeCount || filteredSubscriptions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm font-medium">Upcoming Renewals</p>
            <p className="text-2xl font-bold tracking-tight">{upcomingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="w-full md:flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Button variant="outline" className="shrink-0">
            <ListFilter className="w-4 h-4" />
            Status
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="shrink-0">
            <ArrowUpDown className="w-4 h-4" />
            Sort by
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Subscription Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSubscriptions.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-muted-foreground mb-4">No subscriptions found. Add your first subscription!</p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4" />
                  Add Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredSubscriptions.map((sub) => {
            const status = getSubscriptionStatus(sub)
            return (
              <Card
                key={sub.id}
                className="hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
              >
                <CardContent className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
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
                        <span className={cn("text-sm font-bold", sub.logo && "hidden")}>
                          {sub.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{sub.name}</h3>
                        {getStatusBadge(status)}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {status === 'canceled' ? 'Expired on' : 'Renews on'} {formatDate(sub.nextBillingDate)}
                    </p>
                    <p className="text-lg font-bold">
                      {formatPrice(sub.amount || 0, sub.currency)}
                      <span className="text-muted-foreground text-sm font-normal"> /mo</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })
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
