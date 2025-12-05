'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { X, Plus, Trash2, Upload, ChevronDown, ArrowRight, DollarSign, Tag, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: number
  name: string
}

interface MemberShare {
  memberId: string
  memberName: string
  percentage: number
}

interface SubscriptionFormData {
  // Service
  name: string
  category: string
  websiteUrl: string
  logo: string
  // Pricing
  amount: string
  currency: string
  billingCycleCount: string
  billingCycleUnit: string
  promoPrice: string
  promoEndDate: string
  // Schedule
  startDate: string
  nextBillingDate: string
  freeTrialEndDate: string
  // Details
  autoRenew: boolean
  description: string
  tags: string
  notes: string
  // Sharing
  household: string
  memberShares: MemberShare[]
}

const STEPS = [
  { id: 'service', label: 'Service', required: true },
  { id: 'pricing', label: 'Pricing', required: true },
  { id: 'schedule', label: 'Schedule', required: true },
  { id: 'details', label: 'Details', required: false },
  { id: 'reminders', label: 'Reminders', required: false },
  { id: 'sharing', label: 'Sharing', required: false },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
]

const BILLING_UNITS = [
  { value: 'daily', label: 'Day' },
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
  { value: 'yearly', label: 'Year' },
]

const SERVICE_DOMAINS: Record<string, string> = {
  netflix: 'netflix.com', hulu: 'hulu.com', 'disney+': 'disneyplus.com',
  spotify: 'spotify.com', 'apple music': 'music.apple.com', youtube: 'youtube.com',
  'hbo max': 'hbomax.com', 'amazon prime': 'amazon.com', notion: 'notion.so',
  figma: 'figma.com', github: 'github.com', slack: 'slack.com', zoom: 'zoom.us',
  dropbox: 'dropbox.com', adobe: 'adobe.com', chatgpt: 'openai.com', claude: 'anthropic.com',
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

interface AddSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddSubscriptionModal({ isOpen, onClose, onSuccess }: AddSubscriptionModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const [logoError, setLogoError] = useState(false)

  const [form, setForm] = useState<SubscriptionFormData>({
    name: '',
    category: '',
    websiteUrl: '',
    logo: '',
    amount: '',
    currency: 'USD',
    billingCycleCount: '1',
    billingCycleUnit: 'monthly',
    promoPrice: '',
    promoEndDate: '',
    startDate: new Date().toISOString().split('T')[0],
    nextBillingDate: '',
    freeTrialEndDate: '',
    autoRenew: true,
    description: '',
    tags: '',
    notes: '',
    household: '',
    memberShares: [],
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

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
      const logoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`
      setForm((prev) => ({ ...prev, logo: logoUrl }))
      setLogoPreview(logoUrl)
      setLogoError(false)
    }
  }, [form.name, form.websiteUrl])

  const resetForm = () => {
    setForm({
      name: '',
      category: '',
      websiteUrl: '',
      logo: '',
      amount: '',
      currency: 'USD',
      billingCycleCount: '1',
      billingCycleUnit: 'monthly',
      promoPrice: '',
      promoEndDate: '',
      startDate: new Date().toISOString().split('T')[0],
      nextBillingDate: '',
      freeTrialEndDate: '',
      autoRenew: true,
      description: '',
      tags: '',
      notes: '',
      household: '',
      memberShares: [],
    })
    setCurrentStep(0)
    setLogoPreview('')
    setLogoError(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'service':
        return form.name.trim() !== ''
      case 'pricing':
        return form.amount !== '' && parseFloat(form.amount) > 0
      case 'schedule':
        return form.startDate !== ''
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        logo: form.logo || undefined,
        websiteUrl: form.websiteUrl || undefined,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        currency: form.currency,
        promoPrice: form.promoPrice ? parseFloat(form.promoPrice) : undefined,
        promoEndDate: form.promoEndDate || undefined,
        billingCycle: form.billingCycleUnit,
        frequency: parseInt(form.billingCycleCount),
        autoRenew: form.autoRenew,
        startDate: form.startDate,
        nextBillingDate: form.nextBillingDate || form.startDate,
        freeTrialEndDate: form.freeTrialEndDate || undefined,
        category: form.category ? parseInt(form.category) : undefined,
        notes: form.notes || undefined,
        tags: form.tags ? form.tags.split(',').map(t => ({ tag: t.trim() })).filter(t => t.tag) : undefined,
        household: form.household ? parseInt(form.household) : undefined,
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

      handleClose()
      onSuccess()
    } catch (err) {
      console.error('Submit error:', err)
      alert(err instanceof Error ? err.message : 'Failed to create subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const addMemberShare = () => {
    setForm(prev => ({
      ...prev,
      memberShares: [...prev.memberShares, { memberId: '', memberName: '', percentage: 0 }]
    }))
  }

  const removeMemberShare = (index: number) => {
    setForm(prev => ({
      ...prev,
      memberShares: prev.memberShares.filter((_, i) => i !== index)
    }))
  }

  const updateMemberShare = (index: number, field: keyof MemberShare, value: string | number) => {
    setForm(prev => ({
      ...prev,
      memberShares: prev.memberShares.map((share, i) =>
        i === index ? { ...share, [field]: value } : share
      )
    }))
  }

  if (!isOpen) return null

  const currentStepData = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const isOptionalStep = !currentStepData.required

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 p-6 border-b md:border-b-0 md:border-r border-white/10 shrink-0">
            <nav className="flex flex-col gap-1.5">
              {STEPS.map((step, index) => {
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                return (
                  <button
                    key={step.id}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={cn(
                      'flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-left transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : isCompleted
                        ? 'text-white/80 hover:bg-white/5'
                        : 'text-gray-500 cursor-not-allowed'
                    )}
                  >
                    <span className="text-sm font-medium">{step.label}</span>
                    {!step.required && (
                      <span className="text-xs text-gray-500">(Optional)</span>
                    )}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-white text-2xl font-bold">Add New Subscription</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {currentStepData.id === 'service' && 'Add a new subscription to track your recurring payments'}
                  {currentStepData.id === 'pricing' && 'Set the pricing details for your new subscription'}
                  {currentStepData.id === 'schedule' && 'Set the schedule for your new subscription'}
                  {currentStepData.id === 'details' && 'Add additional details about this subscription'}
                  {currentStepData.id === 'reminders' && 'Configure reminder notifications'}
                  {currentStepData.id === 'sharing' && 'Share the subscription with your household members'}
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {/* Step 1: Service */}
              {currentStepData.id === 'service' && (
                <div>
                  <h2 className="text-white text-lg font-semibold mb-4">Service</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-white text-sm font-medium mb-2">Name*</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Netflix, Spotify"
                        className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Category*</label>
                      <div className="relative">
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full appearance-none rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-white text-sm font-medium mb-2">Website URL</label>
                      <input
                        type="url"
                        value={form.websiteUrl}
                        onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <p className="text-gray-400 text-xs mt-1.5">Official website of the service</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-white text-sm font-medium mb-2">Logo</label>
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-background shrink-0">
                          {logoPreview && !logoError ? (
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-full h-full object-contain"
                              onError={() => setLogoError(true)}
                            />
                          ) : (
                            <Upload className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-center gap-2">
                          <input
                            type="text"
                            value={form.logo}
                            onChange={(e) => {
                              setForm({ ...form, logo: e.target.value })
                              setLogoPreview(e.target.value)
                              setLogoError(false)
                            }}
                            placeholder="Logo URL or auto-fetch"
                            className="w-full rounded-lg text-white border border-white/20 bg-background h-10 px-4 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleFetchLogo}
                            className="self-start px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                          >
                            Auto-fetch Logo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing */}
              {currentStepData.id === 'pricing' && (
                <div>
                  <h2 className="text-white text-lg font-semibold mb-4">Pricing</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Amount*</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          placeholder="15.99"
                          className="w-full rounded-lg text-white border border-white/20 bg-background h-12 pl-10 pr-4 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Currency*</label>
                      <div className="relative">
                        <select
                          value={form.currency}
                          onChange={(e) => setForm({ ...form, currency: e.target.value })}
                          className="w-full appearance-none rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-white text-sm font-medium mb-2">Billing Cycle*</label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          min="1"
                          value={form.billingCycleCount}
                          onChange={(e) => setForm({ ...form, billingCycleCount: e.target.value })}
                          placeholder="1"
                          className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <div className="relative">
                          <select
                            value={form.billingCycleUnit}
                            onChange={(e) => setForm({ ...form, billingCycleUnit: e.target.value })}
                            className="w-full appearance-none rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            {BILLING_UNITS.map((u) => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Promo Price</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.promoPrice}
                          onChange={(e) => setForm({ ...form, promoPrice: e.target.value })}
                          placeholder="e.g. 9.99"
                          className="w-full rounded-lg text-white border border-white/20 bg-background h-12 pl-10 pr-4 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Promo End Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={form.promoEndDate}
                          onChange={(e) => setForm({ ...form, promoEndDate: e.target.value })}
                          className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Schedule */}
              {currentStepData.id === 'schedule' && (
                <div>
                  <h2 className="text-white text-lg font-semibold mb-4">Schedule</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Start Date*</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                          className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Next Billing Date*</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={form.nextBillingDate}
                          onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                          className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-white text-sm font-medium mb-2">Free Trial End Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={form.freeTrialEndDate}
                          onChange={(e) => setForm({ ...form, freeTrialEndDate: e.target.value })}
                          className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      <p className="text-gray-400 text-xs mt-1.5">If applicable, set the date when the free trial period ends.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Details */}
              {currentStepData.id === 'details' && (
                <div>
                  <h2 className="text-white text-lg font-semibold mb-4">Details</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900 border border-white/10">
                      <div>
                        <p className="text-white text-sm font-medium">Auto Renew</p>
                        <p className="text-gray-400 text-xs mt-1">This subscription will automatically renew.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, autoRenew: !form.autoRenew })}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                          form.autoRenew ? 'bg-primary' : 'bg-gray-600'
                        )}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                            form.autoRenew ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Brief description of the service"
                        rows={3}
                        className="w-full rounded-lg text-white border border-white/20 bg-background px-4 py-3 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Tags</label>
                      <input
                        type="text"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="Add tags separated by commas"
                        className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <p className="text-gray-400 text-xs mt-1.5">e.g. entertainment, streaming, music</p>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Any important notes about this subscription"
                        rows={3}
                        className="w-full rounded-lg text-white border border-white/20 bg-background px-4 py-3 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Reminders */}
              {currentStepData.id === 'reminders' && (
                <div>
                  <h2 className="text-white text-lg font-semibold mb-4">Reminders</h2>
                  <p className="text-gray-400">Configure when you&apos;d like to be reminded about this subscription.</p>
                  <div className="mt-6 p-6 rounded-lg border border-dashed border-white/20 text-center">
                    <p className="text-gray-400">Reminder configuration coming soon.</p>
                    <p className="text-gray-500 text-sm mt-2">You can skip this step for now.</p>
                  </div>
                </div>
              )}

              {/* Step 6: Sharing */}
              {currentStepData.id === 'sharing' && (
                <div>
                  <h2 className="text-white text-lg font-semibold mb-4">Sharing</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Household</label>
                      <div className="relative">
                        <select
                          value={form.household}
                          onChange={(e) => setForm({ ...form, household: e.target.value })}
                          className="w-full appearance-none rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Select a household</option>
                          <option value="1">My Household</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      <p className="text-gray-400 text-xs mt-1.5">Which household is this subscription associated with?</p>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Member Share</label>
                      <div className="space-y-4">
                        {form.memberShares.map((share, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="relative flex-1">
                              <select
                                value={share.memberId}
                                onChange={(e) => updateMemberShare(index, 'memberId', e.target.value)}
                                className="w-full appearance-none rounded-lg text-white border border-white/20 bg-background h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                <option value="">Select Member</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="relative w-28">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={share.percentage}
                                onChange={(e) => updateMemberShare(index, 'percentage', parseInt(e.target.value) || 0)}
                                placeholder="50"
                                className="w-full rounded-lg text-white border border-white/20 bg-background h-12 px-4 pr-8 text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMemberShare(index)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addMemberShare}
                          className="flex w-full items-center justify-center gap-2 h-11 rounded-lg border border-dashed border-white/20 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Member
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs mt-1.5">Divide the cost among household members. The total share must add up to 100%.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/10">
              <button
                type="button"
                onClick={currentStep === 0 ? handleClose : handleBack}
                className="flex items-center justify-center h-11 px-6 rounded-lg border border-white/20 text-white text-sm font-bold hover:bg-white/10 transition-colors"
              >
                {currentStep === 0 ? 'Cancel' : 'Back'}
              </button>
              <div className="flex gap-4">
                {isOptionalStep && !isLastStep && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex items-center justify-center h-11 px-6 rounded-lg bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors"
                  >
                    Skip
                  </button>
                )}
                {isLastStep ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/80 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Subscription'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStep === 0 ? 'Next Step' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
