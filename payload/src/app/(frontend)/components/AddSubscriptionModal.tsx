'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { X, Plus, Trash2, Upload, ChevronDown, ArrowRight, ArrowLeft, DollarSign, Percent, Layers, Tag, CalendarDays, FileText, Bell, Users, RefreshCw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
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
  name: string
  category: string
  websiteUrl: string
  logo: string
  amount: string
  currency: string
  billingCycleCount: string
  billingCycleUnit: string
  promoPrice: string
  promoEndDate: string
  startDate: string
  nextBillingDate: string
  freeTrialEndDate: string
  autoRenew: boolean
  description: string
  tags: string
  notes: string
  household: string
  memberShares: MemberShare[]
  // Reminders
  enableRenewalReminder: boolean
  enableRefundReminder: boolean
  enableContractExpiry: boolean
}

const STEPS = [
  { id: 'service', label: 'Service', icon: Layers, required: true },
  { id: 'pricing', label: 'Pricing', icon: Tag, required: true },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays, required: true },
  { id: 'details', label: 'Details', icon: FileText, required: false },
  { id: 'reminders', label: 'Reminders', icon: Bell, required: false },
  { id: 'sharing', label: 'Sharing', icon: Users, required: false },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'VND', label: 'VND - Vietnamese Dong' },
]

const BILLING_UNITS = [
  { value: 'days', label: 'Day(s)' },
  { value: 'weeks', label: 'Week(s)' },
  { value: 'months', label: 'Month(s)' },
  { value: 'years', label: 'Year(s)' },
]

const SERVICE_DOMAINS: Record<string, string> = {
  netflix: 'netflix.com', spotify: 'spotify.com', youtube: 'youtube.com',
  figma: 'figma.com', github: 'github.com', notion: 'notion.so',
  adobe: 'adobe.com', chatgpt: 'openai.com', claude: 'anthropic.com',
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
    name: '', category: '', websiteUrl: '', logo: '',
    amount: '', currency: 'USD', billingCycleCount: '1', billingCycleUnit: 'months',
    promoPrice: '', promoEndDate: '',
    startDate: new Date().toISOString().split('T')[0], nextBillingDate: '', freeTrialEndDate: '',
    autoRenew: true, description: '', tags: '', notes: '',
    household: '', memberShares: [],
    enableRenewalReminder: true, enableRefundReminder: true, enableContractExpiry: false,
  })

  useEffect(() => {
    if (isOpen) fetchCategories()
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
    if (form.websiteUrl.trim()) domain = extractDomainFromUrl(form.websiteUrl)
    if (!domain && form.name.trim()) domain = getDomainFromName(form.name)
    if (domain) {
      const logoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`
      setForm((prev) => ({ ...prev, logo: logoUrl }))
      setLogoPreview(logoUrl)
      setLogoError(false)
    }
  }, [form.name, form.websiteUrl])

  const resetForm = () => {
    setForm({
      name: '', category: '', websiteUrl: '', logo: '',
      amount: '', currency: 'USD', billingCycleCount: '1', billingCycleUnit: 'months',
      promoPrice: '', promoEndDate: '',
      startDate: new Date().toISOString().split('T')[0], nextBillingDate: '', freeTrialEndDate: '',
      autoRenew: true, description: '', tags: '', notes: '',
      household: '', memberShares: [],
      enableRenewalReminder: true, enableRefundReminder: true, enableContractExpiry: false,
    })
    setCurrentStep(0)
    setLogoPreview('')
    setLogoError(false)
  }

  const handleClose = () => { resetForm(); onClose() }
  const handleNext = () => { if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1) }
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1) }

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'service': return form.name.trim() !== ''
      case 'pricing': return form.amount !== '' && parseFloat(form.amount) > 0
      case 'schedule': return form.startDate !== ''
      default: return true
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        name: form.name, logo: form.logo || undefined, websiteUrl: form.websiteUrl || undefined,
        description: form.description || undefined, amount: parseFloat(form.amount), currency: form.currency,
        promoPrice: form.promoPrice ? parseFloat(form.promoPrice) : undefined,
        promoEndDate: form.promoEndDate || undefined, billingCycle: form.billingCycleUnit,
        frequency: parseInt(form.billingCycleCount), autoRenew: form.autoRenew, startDate: form.startDate,
        nextBillingDate: form.nextBillingDate || form.startDate,
        freeTrialEndDate: form.freeTrialEndDate || undefined,
        category: form.category ? parseInt(form.category) : undefined, notes: form.notes || undefined,
        tags: form.tags ? form.tags.split(',').map(t => ({ tag: t.trim() })).filter(t => t.tag) : undefined,
        household: form.household ? parseInt(form.household) : undefined,
      }

      const res = await fetch('/api/subscriptions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload),
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
    setForm(prev => ({ ...prev, memberShares: [...prev.memberShares, { memberId: '', memberName: '', percentage: 50 }] }))
  }

  const removeMemberShare = (index: number) => {
    setForm(prev => ({ ...prev, memberShares: prev.memberShares.filter((_, i) => i !== index) }))
  }

  const updateMemberShare = (index: number, field: keyof MemberShare, value: string | number) => {
    setForm(prev => ({
      ...prev,
      memberShares: prev.memberShares.map((share, i) => i === index ? { ...share, [field]: value } : share)
    }))
  }

  if (!isOpen) return null

  const currentStepData = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const isOptionalStep = !currentStepData.required

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl bg-background border border-border rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-56 p-4 border-b md:border-b-0 md:border-r border-border shrink-0">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Add New Subscription</h2>
              <p className="text-xs text-muted-foreground">Add a new subscription to track your recurring payments</p>
            </div>
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                return (
                  <button
                    key={step.id}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap',
                      isActive ? 'bg-primary text-white' : isCompleted ? 'text-foreground hover:bg-card' : 'text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">{step.label}</span>
                    {!step.required && <span className="text-xs opacity-60 hidden md:inline">(Optional)</span>}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold">Add New Subscription</h1>
                <p className="text-sm text-muted-foreground">
                  {currentStepData.id === 'service' && 'Add a new subscription to track your recurring payments'}
                  {currentStepData.id === 'pricing' && 'Set the pricing details for your new recurring payment.'}
                  {currentStepData.id === 'schedule' && 'Set the schedule for your new subscription'}
                  {currentStepData.id === 'details' && 'Add details for your new subscription.'}
                  {currentStepData.id === 'reminders' && 'Set up important reminders for your subscription'}
                  {currentStepData.id === 'sharing' && 'Share the subscription with your household members.'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {/* Step 1: Service */}
              {currentStepData.id === 'service' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Service</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name*</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Netflix, Spotify" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-2">
                      <div className="space-y-2">
                        <Label>Category*</Label>
                        <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          <option value="">Select a category</option>
                          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button variant="outline" size="icon" className="h-10 w-10"><Plus className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Website URL</Label>
                      <Input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://example.com" />
                      <p className="text-xs text-muted-foreground">Official website of the service</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-border">
                        <div className="w-16 h-16 rounded-lg border border-border flex items-center justify-center overflow-hidden bg-muted shrink-0">
                          {logoPreview && !logoError ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} />
                          ) : (
                            <Upload className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, SVG up to 5MB</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={handleFetchLogo}>Auto-fetch Logo</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing */}
              {currentStepData.id === 'pricing' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-semibold">Pricing Configuration</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount*</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="15.99" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency*</Label>
                      <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                        {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Cycle*</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" min="1" value={form.billingCycleCount} onChange={(e) => setForm({ ...form, billingCycleCount: e.target.value })} />
                      <Select value={form.billingCycleUnit} onChange={(e) => setForm({ ...form, billingCycleUnit: e.target.value })}>
                        {BILLING_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Promo Price <span className="text-muted-foreground">(Optional)</span></Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" step="0.01" min="0" value={form.promoPrice} onChange={(e) => setForm({ ...form, promoPrice: e.target.value })} placeholder="e.g. 9.99" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Promo End Date <span className="text-muted-foreground">(Optional)</span></Label>
                      <Input type="date" value={form.promoEndDate} onChange={(e) => setForm({ ...form, promoEndDate: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Schedule */}
              {currentStepData.id === 'schedule' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Schedule</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date*</Label>
                      <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Billing Date*</Label>
                      <Input type="date" value={form.nextBillingDate} onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Free Trial End Date</Label>
                    <Input type="date" value={form.freeTrialEndDate} onChange={(e) => setForm({ ...form, freeTrialEndDate: e.target.value })} />
                    <p className="text-xs text-muted-foreground">If applicable, set the date when the free trial period ends.</p>
                  </div>
                </div>
              )}

              {/* Step 4: Details */}
              {currentStepData.id === 'details' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Details</h3>
                  <Card>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Auto Renew</p>
                          <p className="text-xs text-muted-foreground">This subscription will automatically renew.</p>
                        </div>
                      </div>
                      <Switch checked={form.autoRenew} onCheckedChange={(checked) => setForm({ ...form, autoRenew: checked })} />
                    </CardContent>
                  </Card>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the service" rows={3} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. entertainment, streaming, music" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any important notes about this subscription" rows={3} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                </div>
              )}

              {/* Step 5: Reminders */}
              {currentStepData.id === 'reminders' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Reminders</h3>
                  <p className="text-sm text-muted-foreground">Set up important reminders for your subscription</p>

                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="flex items-start gap-3 p-4">
                      <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm">This is an individual reminder for this subscription only. It does not affect your regular batch notifications (daily/weekly digests).</p>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Billing Reminder</h4>
                    <p className="text-xs text-muted-foreground">Get notified before your next billing date</p>
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">Set reminder for this subscription</p>
                          <p className="text-xs text-muted-foreground">Get notified at a specific time before renewal</p>
                        </div>
                        <Switch checked={form.enableRenewalReminder} onCheckedChange={(checked) => setForm({ ...form, enableRenewalReminder: checked })} />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Refund reminders</h4>
                    <p className="text-xs text-muted-foreground">Track refund deadlines and get reminded before they expire</p>
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">Set reminder for refund deadline</p>
                          <p className="text-xs text-muted-foreground">Get alerted before your refund window closes</p>
                        </div>
                        <Switch checked={form.enableRefundReminder} onCheckedChange={(checked) => setForm({ ...form, enableRefundReminder: checked })} />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Contract Expiry</h4>
                    <p className="text-xs text-muted-foreground">Track when your contract commitment ends</p>
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">Enable Contract Expiry Reminder</p>
                          <p className="text-xs text-muted-foreground">Get notified before your contract expires</p>
                        </div>
                        <Switch checked={form.enableContractExpiry} onCheckedChange={(checked) => setForm({ ...form, enableContractExpiry: checked })} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 6: Sharing */}
              {currentStepData.id === 'sharing' && (
                <div className="space-y-4">
                  <div className="uppercase text-xs font-semibold text-muted-foreground tracking-wider">Sharing Details</div>
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Select disabled>
                      <option>John Doe (You)</option>
                    </Select>
                    <p className="text-xs text-muted-foreground">Who is the primary owner of this subscription?</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Household</Label>
                    <Select value={form.household} onChange={(e) => setForm({ ...form, household: e.target.value })}>
                      <option value="">Select a household</option>
                      <option value="1">My Household</option>
                    </Select>
                    <p className="text-xs text-muted-foreground">Which household is this subscription associated with?</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Member Share</Label>
                    <div className="space-y-2">
                      {form.memberShares.map((share, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select value={share.memberId} onChange={(e) => updateMemberShare(index, 'memberId', e.target.value)} className="flex-1">
                            <option value="">Select Member</option>
                            <option value="jane">Jane Smith</option>
                            <option value="mike">Mike Johnson</option>
                          </Select>
                          <div className="relative w-24">
                            <Input type="number" min="0" max="100" value={share.percentage} onChange={(e) => updateMemberShare(index, 'percentage', parseInt(e.target.value) || 0)} className="pr-8 text-right" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeMemberShare(index)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" onClick={addMemberShare}>
                        <Plus className="w-4 h-4" />
                        Add Member
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Divide the cost among household members. Total must be 100%.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <Button variant="outline" onClick={currentStep === 0 ? handleClose : handleBack}>
                {currentStep === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4" />Back</>}
              </Button>
              <div className="flex gap-2">
                {isOptionalStep && !isLastStep && (
                  <Button variant="secondary" onClick={handleNext}>Skip</Button>
                )}
                {isLastStep ? (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Next'}
                  </Button>
                ) : (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Next Step <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
