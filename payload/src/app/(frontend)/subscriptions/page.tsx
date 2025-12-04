'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Filter, ArrowUpDown, MoreVertical, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Subscription {
  id: number
  name: string
  logo?: string
  price: number
  currency: string
  repeatEvery: number
  billingCycle: string
  nextBillingDate?: string
  status: string
  isRecurring: boolean
}

interface Category {
  id: number
  name: string
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
  KRW: '₩',
  BRL: 'R$',
  MXN: 'MX$',
  VND: '₫',
  THB: '฿',
  SGD: 'S$',
  CHF: 'Fr',
  CNY: '¥',
}

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'KRW', label: 'KRW (₩)' },
  { value: 'VND', label: 'VND (₫)' },
  { value: 'THB', label: 'THB (฿)' },
  { value: 'SGD', label: 'SGD (S$)' },
  { value: 'CHF', label: 'CHF (Fr)' },
  { value: 'CNY', label: 'CNY (¥)' },
]

const BILLING_CYCLES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const SERVICE_DOMAINS: Record<string, string> = {
  netflix: 'netflix.com',
  hulu: 'hulu.com',
  'disney+': 'disneyplus.com',
  spotify: 'spotify.com',
  'apple music': 'music.apple.com',
  youtube: 'youtube.com',
  'hbo max': 'hbomax.com',
  'amazon prime': 'amazon.com',
  notion: 'notion.so',
  figma: 'figma.com',
  github: 'github.com',
  slack: 'slack.com',
  zoom: 'zoom.us',
  dropbox: 'dropbox.com',
  adobe: 'adobe.com',
  chatgpt: 'openai.com',
  claude: 'anthropic.com',
}

function getDomainFromName(name: string): string | null {
  const normalized = name.toLowerCase().trim()
  if (SERVICE_DOMAINS[normalized]) return SERVICE_DOMAINS[normalized]
  for (const [key, domain] of Object.entries(SERVICE_DOMAINS)) {
    if (normalized.includes(key) || key.includes(normalized)) return domain
  }
  return null
}

function extractDomainFromUrl(url: string): string | null {
  try {
    let urlToParse = url.trim()
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse
    }
    const parsed = new URL(urlToParse)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function buildLogoUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [logoError, setLogoError] = useState(false)

  const [form, setForm] = useState({
    name: '',
    logo: '',
    websiteUrl: '',
    description: '',
    price: '',
    currency: 'USD',
    promoPrice: '',
    promoEndDate: '',
    billingCycle: 'monthly',
    repeatEvery: '1',
    isRecurring: true,
    startDate: new Date().toISOString().split('T')[0],
    freeTrialDays: '',
    trialEndDate: '',
    category: '',
    notes: '',
  })

  useEffect(() => {
    fetchSubscriptions()
    fetchCategories()
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

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCategories(data.docs || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleFetchLogo = useCallback(() => {
    let domain: string | null = null

    if (form.websiteUrl.trim()) {
      domain = extractDomainFromUrl(form.websiteUrl)
    }

    if (!domain && form.name.trim()) {
      domain = getDomainFromName(form.name)
    }

    if (domain) {
      const logoUrl = buildLogoUrl(domain)
      setForm((prev) => ({ ...prev, logo: logoUrl }))
      setLogoPreview(logoUrl)
      setLogoError(false)
    }
  }, [form.name, form.websiteUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        name: form.name,
        logo: form.logo || undefined,
        websiteUrl: form.websiteUrl || undefined,
        description: form.description || undefined,
        price: parseFloat(form.price),
        currency: form.currency,
        promoPrice: form.promoPrice ? parseFloat(form.promoPrice) : undefined,
        promoEndDate: form.promoEndDate || undefined,
        billingCycle: form.billingCycle,
        repeatEvery: parseInt(form.repeatEvery),
        isRecurring: form.isRecurring,
        startDate: form.startDate,
        freeTrialDays: form.freeTrialDays ? parseInt(form.freeTrialDays) : undefined,
        trialEndDate: form.trialEndDate || undefined,
        category: form.category ? parseInt(form.category) : undefined,
        notes: form.notes || undefined,
      }

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.errors?.[0]?.message || 'Failed to create subscription')
      }

      setShowModal(false)
      resetForm()
      fetchSubscriptions()
    } catch (err) {
      console.error('Submit error:', err)
      alert(err instanceof Error ? err.message : 'Failed to create subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      logo: '',
      websiteUrl: '',
      description: '',
      price: '',
      currency: 'USD',
      promoPrice: '',
      promoEndDate: '',
      billingCycle: 'monthly',
      repeatEvery: '1',
      isRecurring: true,
      startDate: new Date().toISOString().split('T')[0],
      freeTrialDays: '',
      trialEndDate: '',
      category: '',
      notes: '',
    })
    setLogoPreview('')
    setLogoError(false)
  }

  const formatBillingCycle = (repeatEvery: number, billingCycle: string) => {
    if (repeatEvery === 1) {
      const labels: Record<string, string> = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
      }
      return labels[billingCycle] || billingCycle
    }
    const cycleMap: Record<string, string> = {
      daily: 'days',
      weekly: 'weeks',
      monthly: 'months',
      yearly: 'years',
    }
    return `Every ${repeatEvery} ${cycleMap[billingCycle] || billingCycle}`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatPrice = (price: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency
    return `${symbol}${price.toFixed(2)}`
  }

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5" />
          New Subscription
        </Button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Subscription List */}
      <div className="flex flex-col gap-3">
        {filteredSubscriptions.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            No subscriptions found. Add your first subscription!
          </Card>
        ) : (
          filteredSubscriptions.map((sub) => (
            <Card key={sub.id} className="flex items-center p-4 gap-4">
              {/* Logo */}
              <div className="w-28 h-12 flex items-center justify-start shrink-0">
                {sub.logo ? (
                  <img
                    src={sub.logo}
                    alt={sub.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-[120px]">
                <span className="font-semibold">{sub.name}</span>
              </div>

              {/* Billing Cycle */}
              <div className="min-w-[120px] text-sm text-muted-foreground">
                {formatBillingCycle(sub.repeatEvery, sub.billingCycle)}
              </div>

              {/* Next Billing Date */}
              <div className="min-w-[80px] text-sm text-center">
                {formatDate(sub.nextBillingDate)}
              </div>

              {/* Price */}
              <div className="min-w-[80px] text-right font-semibold">
                {formatPrice(sub.price, sub.currency)}
              </div>

              {/* Recurring Badge */}
              <div className="min-w-[50px] text-center">
                {sub.isRecurring ? (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Auto</span>
                ) : (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Once</span>
                )}
              </div>

              {/* Menu Button */}
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* New Subscription Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Subscription</DialogTitle>
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Logo Preview */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview && !logoError ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Logo URL (auto-fetched)"
                  value={form.logo}
                  onChange={(e) => {
                    setForm({ ...form, logo: e.target.value })
                    setLogoPreview(e.target.value)
                    setLogoError(false)
                  }}
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleFetchLogo}>
                Auto-fetch
              </Button>
            </div>

            {/* Name */}
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Netflix, Spotify"
                required
              />
            </div>

            {/* Website URL */}
            <div>
              <Label>Website URL</Label>
              <Input
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description..."
                rows={2}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
              />
            </div>

            {/* Price & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="9.99"
                  required
                />
              </div>
              <div>
                <Label>Currency</Label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Promo Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Promo Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.promoPrice}
                  onChange={(e) => setForm({ ...form, promoPrice: e.target.value })}
                  placeholder="4.99"
                />
              </div>
              <div>
                <Label>Promo Ends</Label>
                <Input
                  type="date"
                  value={form.promoEndDate}
                  onChange={(e) => setForm({ ...form, promoEndDate: e.target.value })}
                />
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Billing Cycle *</Label>
                <select
                  value={form.billingCycle}
                  onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {BILLING_CYCLES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Repeat Every</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.repeatEvery}
                  onChange={(e) => setForm({ ...form, repeatEvery: e.target.value })}
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>

            {/* Free Trial */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Free Trial (days)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.freeTrialDays}
                  onChange={(e) => setForm({ ...form, freeTrialDays: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Trial End Date</Label>
                <Input
                  type="date"
                  value={form.trialEndDate}
                  onChange={(e) => setForm({ ...form, trialEndDate: e.target.value })}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Recurring */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Recurring Subscription</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Subscription
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
