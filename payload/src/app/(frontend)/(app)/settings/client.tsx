'use client'

import React, { useState } from 'react'
import { User, Bell, CreditCard, Settings as SettingsIcon, Plus, Shield, Trash2, Receipt, Check, Sparkles, Crown, Zap, Loader2 } from 'lucide-react'
import type { Plan, UserPlan } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { UserSetting } from '@/payload-types'

const settingsTabs = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'privacy', label: 'Privacy', icon: Shield },
]

interface UserData {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

interface SettingsClientProps {
  initialUser: UserData
  initialSettings: UserSetting | null
  currentPlan: Plan | null
  userPlan: UserPlan | null
  allPlans: Plan[]
}

export default function SettingsClient({ initialUser, initialSettings, currentPlan, userPlan, allPlans }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState('account')
  const [saving, setSaving] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
  const [settings, setSettings] = useState<UserSetting | null>(initialSettings)
  const [firstName, setFirstName] = useState(initialUser.firstName || '')
  const [lastName, setLastName] = useState(initialUser.lastName || '')
  const email = initialUser.email
  const userId = initialUser.id
  const { addToast } = useToast()

  // Payment method dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState<{
    type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_account' | 'apple_pay' | 'google_pay'
    label: string
    lastFour: string
    expiryDate: string
  }>({
    type: 'credit_card',
    label: '',
    lastFour: '',
    expiryDate: '',
  })

  // Upgrade preview dialog state
  const [showUpgradePreview, setShowUpgradePreview] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [upgradePreview, setUpgradePreview] = useState<{
    canUpgrade: boolean
    upgradeType: 'new_subscription' | 'plan_change' | 'immediate_charge'
    currentPlan: { name: string; price: number; billingCycle: string; daysRemaining: number } | null
    targetPlan: { name: string; price: number; billingCycle: string }
    proration: { credit: number; amountDue: number; daysRemaining: number; isEstimate?: boolean }
    message: string
  } | null>(null)
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<Plan | null>(null)

  const handleSaveAccount = async () => {
    setSaving(true)
    try {
      const userRes = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
      })

      if (settings) {
        const settingsRes = await fetch(`/api/user-settings/${settings.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: settings.account }),
        })
        if (!settingsRes.ok) throw new Error('Failed to save settings')
      }

      if (!userRes.ok) throw new Error('Failed to save user')
      addToast('Account settings saved', 'success')
    } catch (error) {
      console.error('Error saving account:', error)
      addToast('Failed to save account settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch(`/api/user-settings/${settings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: settings.notifications }),
      })
      if (!res.ok) throw new Error('Failed to save')
      addToast('Notification settings saved', 'success')
    } catch (error) {
      console.error('Error saving notifications:', error)
      addToast('Failed to save notification settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGeneral = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch(`/api/user-settings/${settings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ general: settings.general }),
      })
      if (!res.ok) throw new Error('Failed to save')
      addToast('General settings saved', 'success')
    } catch (error) {
      console.error('Error saving general settings:', error)
      addToast('Failed to save general settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch(`/api/user-settings/${settings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy: settings.privacy }),
      })
      if (!res.ok) throw new Error('Failed to save')
      addToast('Privacy settings saved', 'success')
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      addToast('Failed to save privacy settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePayments = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch(`/api/user-settings/${settings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments: settings.payments }),
      })
      if (!res.ok) throw new Error('Failed to save')
      addToast('Payment settings saved', 'success')
    } catch (error) {
      console.error('Error saving payment settings:', error)
      addToast('Failed to save payment settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Payment method handlers
  const handleAddPaymentMethod = async () => {
    if (!settings || !newPaymentMethod.label || !newPaymentMethod.lastFour) {
      addToast('Please fill in all required fields', 'error')
      return
    }

    const isFirst = !settings.payments?.paymentMethods?.length
    const newMethod = {
      ...newPaymentMethod,
      isDefault: isFirst,
    }

    const updatedPaymentMethods = [...(settings.payments?.paymentMethods || []), newMethod]

    setSaving(true)
    try {
      const res = await fetch(`/api/user-settings/${settings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: {
            ...settings.payments,
            paymentMethods: updatedPaymentMethods,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to add payment method')

      setSettings({
        ...settings,
        payments: {
          ...settings.payments,
          paymentMethods: updatedPaymentMethods,
        },
      })
      setShowPaymentDialog(false)
      setNewPaymentMethod({ type: 'credit_card', label: '', lastFour: '', expiryDate: '' })
      addToast('Payment method added', 'success')
    } catch (error) {
      console.error('Error adding payment method:', error)
      addToast('Failed to add payment method', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRemovePaymentMethod = async (index: number) => {
    if (!settings) return

    const updatedPaymentMethods = settings.payments?.paymentMethods?.filter((_, i) => i !== index) || []

    // If removed method was default, set first remaining as default
    if (updatedPaymentMethods.length > 0 && !updatedPaymentMethods.some((m) => m.isDefault)) {
      updatedPaymentMethods[0].isDefault = true
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/user-settings/${settings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: {
            ...settings.payments,
            paymentMethods: updatedPaymentMethods,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to remove payment method')

      setSettings({
        ...settings,
        payments: {
          ...settings.payments,
          paymentMethods: updatedPaymentMethods,
        },
      })
      addToast('Payment method removed', 'success')
    } catch (error) {
      console.error('Error removing payment method:', error)
      addToast('Failed to remove payment method', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefaultPaymentMethod = async (index: number) => {
    if (!settings) return

    const updatedPaymentMethods =
      settings.payments?.paymentMethods?.map((method, i) => ({
        ...method,
        isDefault: i === index,
      })) || []

    setSaving(true)
    try {
      const res = await fetch(`/api/user-settings/${settings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: {
            ...settings.payments,
            paymentMethods: updatedPaymentMethods,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to update default')

      setSettings({
        ...settings,
        payments: {
          ...settings.payments,
          paymentMethods: updatedPaymentMethods,
        },
      })
      addToast('Default payment method updated', 'success')
    } catch (error) {
      console.error('Error setting default payment method:', error)
      addToast('Failed to update default payment method', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationSetting = (key: keyof NonNullable<UserSetting['notifications']>, value: boolean | number) => {
    if (!settings) return
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    })
  }

  const updateGeneralSetting = (key: keyof NonNullable<UserSetting['general']>, value: string | boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      general: { ...settings.general, [key]: value },
    })
  }

  const updatePrivacySetting = (key: keyof NonNullable<UserSetting['privacy']>, value: boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      privacy: { ...settings.privacy, [key]: value },
    })
  }

  const updateAccountSetting = (key: keyof NonNullable<UserSetting['account']>, value: string | boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      account: { ...settings.account, [key]: value },
    })
  }

  // Billing functions
  const handleUpgradePlan = async (plan: Plan) => {
    // For free users or users without proration, go directly to checkout
    if (!currentPlan || currentPlan.billingCycle === 'free') {
      setUpgradingPlan(plan.slug)
      try {
        const res = await fetch('/api/polar/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ targetPlanSlug: plan.slug }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to create checkout')
        }

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        } else if (data.action === 'subscription_updated') {
          addToast(data.message, 'success')
          window.location.reload()
        }
      } catch (error) {
        console.error('Upgrade error:', error)
        addToast(error instanceof Error ? error.message : 'Failed to start upgrade', 'error')
        setUpgradingPlan(null)
      }
      return
    }

    // For paid users, show proration preview first
    setSelectedUpgradePlan(plan)
    setLoadingPreview(true)
    setShowUpgradePreview(true)

    try {
      const res = await fetch('/api/polar/upgrade-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetPlanSlug: plan.slug }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get upgrade preview')
      }

      setUpgradePreview(data)
    } catch (error) {
      console.error('Preview error:', error)
      addToast(error instanceof Error ? error.message : 'Failed to get upgrade preview', 'error')
      setShowUpgradePreview(false)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleConfirmUpgrade = async () => {
    if (!selectedUpgradePlan) return

    setUpgradingPlan(selectedUpgradePlan.slug)
    setShowUpgradePreview(false)

    try {
      const res = await fetch('/api/polar/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetPlanSlug: selectedUpgradePlan.slug }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process upgrade')
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.action === 'subscription_updated') {
        addToast(data.message, 'success')
        window.location.reload()
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      addToast(error instanceof Error ? error.message : 'Failed to process upgrade', 'error')
      setUpgradingPlan(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/polar/cancel', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      addToast(data.message, 'success')
      window.location.reload()
    } catch (error) {
      console.error('Cancel error:', error)
      addToast(error instanceof Error ? error.message : 'Failed to cancel subscription', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/polar/portal', {
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get portal URL')
      }

      window.open(data.portalUrl, '_blank')
    } catch (error) {
      console.error('Portal error:', error)
      addToast('Failed to open subscription portal', 'error')
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)
  }

  const getPlanIcon = (slug: string) => {
    if (slug === 'free') return Sparkles
    if (slug === 'lifetime') return Crown
    return Zap
  }

  const fullName = `${firstName} ${lastName}`.trim() || 'User'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Settings Sidebar */}
      <aside className="w-56 p-4 border-r border-border hidden lg:flex lg:flex-col shrink-0">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white">
            {fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex flex-col gap-1">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  isActive ? 'bg-primary text-white' : 'text-foreground hover:bg-card'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 lg:p-8 pb-0 shrink-0">
          <div className="max-w-3xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings, preferences, and payment methods.</p>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-2">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="shrink-0"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 pt-0">
          <div className="max-w-3xl">

          {/* Account Settings */}
          {activeTab === 'account' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Account Settings</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (optional)</Label>
                  <Input
                    id="displayName"
                    value={settings?.account?.displayName || ''}
                    onChange={(e) => updateAccountSetting('displayName', e.target.value)}
                    placeholder="Override your first and last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={settings?.account?.phoneNumber || ''}
                    onChange={(e) => updateAccountSetting('phoneNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                  </div>
                  <Switch
                    checked={settings?.account?.twoFactorEnabled || false}
                    onCheckedChange={(checked) => updateAccountSetting('twoFactorEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Button onClick={handleSaveAccount} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="link" className="text-destructive hover:text-destructive/80">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing - App Subscription */}
          {activeTab === 'billing' && (
            <>
              {/* Current Plan Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Current Plan</CardTitle>
                  <CardDescription>Your Wallie subscription status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-white">
                        {currentPlan?.slug === 'lifetime' ? (
                          <Crown className="w-6 h-6" />
                        ) : currentPlan?.slug === 'free' ? (
                          <Sparkles className="w-6 h-6" />
                        ) : (
                          <Zap className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{currentPlan?.name || 'Free'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentPlan?.billingCycle === 'free' && 'Free forever'}
                          {currentPlan?.billingCycle === 'monthly' && `$${formatPrice(currentPlan.price)}/month`}
                          {currentPlan?.billingCycle === 'yearly' && `$${formatPrice(currentPlan.price)}/year`}
                          {currentPlan?.billingCycle === 'lifetime' && 'One-time purchase'}
                        </p>
                      </div>
                    </div>
                    {userPlan?.paymentProvider === 'polar' && currentPlan?.billingCycle !== 'lifetime' && currentPlan?.billingCycle !== 'free' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                          Manage
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleCancelSubscription} disabled={saving}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Plan Features */}
                  {currentPlan && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        <span>
                          {currentPlan.limits?.maxSubscriptions === -1
                            ? 'Unlimited subscriptions'
                            : `Up to ${currentPlan.limits?.maxSubscriptions || 5} subscriptions`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        <span>
                          {currentPlan.limits?.maxHouseholds === -1
                            ? 'Unlimited households'
                            : `Up to ${currentPlan.limits?.maxHouseholds || 1} household`}
                        </span>
                      </div>
                      {currentPlan.features?.advancedAnalytics && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Advanced analytics</span>
                        </div>
                      )}
                      {currentPlan.features?.aiAssistant && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>AI assistant</span>
                        </div>
                      )}
                      {currentPlan.features?.smartNotifications && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Smart notifications</span>
                        </div>
                      )}
                      {currentPlan.features?.priceAlerts && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Price alerts</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upgrade Options */}
              {(!currentPlan || currentPlan.billingCycle === 'free') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upgrade Your Plan</CardTitle>
                    <CardDescription>Get more features and unlimited access.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {allPlans
                        .filter((plan) => plan.slug !== 'free')
                        .map((plan) => {
                          const PlanIcon = getPlanIcon(plan.slug)
                          const isCurrentPlan = currentPlan?.slug === plan.slug

                          return (
                            <div
                              key={plan.id}
                              className={cn(
                                'relative rounded-xl border p-4 transition-all',
                                plan.slug === 'lifetime'
                                  ? 'border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-transparent'
                                  : 'border-border hover:border-primary/50'
                              )}
                            >
                              {plan.slug === 'lifetime' && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                  <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">Best Value</Badge>
                                </div>
                              )}
                              <div className="flex flex-col items-center text-center">
                                <div className={cn(
                                  'flex size-10 items-center justify-center rounded-lg mb-3',
                                  plan.slug === 'lifetime' ? 'bg-yellow-500 text-yellow-950' : 'bg-primary/10 text-primary'
                                )}>
                                  <PlanIcon className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold">{plan.name}</h4>
                                <div className="mt-1">
                                  <span className="text-2xl font-bold">${formatPrice(plan.price)}</span>
                                  {plan.billingCycle === 'monthly' && <span className="text-muted-foreground">/mo</span>}
                                  {plan.billingCycle === 'yearly' && <span className="text-muted-foreground">/yr</span>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {plan.billingCycle === 'lifetime' && 'One-time payment'}
                                  {plan.billingCycle === 'yearly' && 'Save 17%'}
                                </p>
                                <Button
                                  className="w-full mt-4"
                                  variant={plan.slug === 'lifetime' ? 'default' : 'outline'}
                                  disabled={isCurrentPlan || upgradingPlan === plan.slug}
                                  onClick={() => handleUpgradePlan(plan)}
                                >
                                  {upgradingPlan === plan.slug ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : isCurrentPlan ? (
                                    'Current Plan'
                                  ) : (
                                    'Upgrade'
                                  )}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                    </div>

                    {/* Features Comparison */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-medium mb-3">All Pro features include:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Unlimited subscriptions
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Unlimited households
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Advanced analytics
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          AI quick entry
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Smart notifications
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Price hike alerts
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* If already on paid plan, show upgrade to lifetime option */}
              {currentPlan && currentPlan.billingCycle !== 'free' && currentPlan.billingCycle !== 'lifetime' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Upgrade to Lifetime
                    </CardTitle>
                    <CardDescription>One-time payment, forever access.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {allPlans
                      .filter((plan) => plan.slug === 'lifetime')
                      .map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
                          <div>
                            <h4 className="font-bold">{plan.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Pay ${formatPrice(plan.price)} once, use forever
                            </p>
                          </div>
                          <Button
                            onClick={() => handleUpgradePlan(plan)}
                            disabled={upgradingPlan === plan.slug}
                            className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                          >
                            {upgradingPlan === plan.slug ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Upgrade to Lifetime'
                            )}
                          </Button>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Notification Preferences */}
          {activeTab === 'notifications' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via email.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.emailNotifications ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('emailNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive push notifications on your device.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.pushNotifications ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('pushNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Upcoming Payment Reminders</p>
                    <p className="text-xs text-muted-foreground">Receive alerts before your subscriptions are due.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.paymentReminders ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('paymentReminders', checked)}
                  />
                </div>
                {settings?.notifications?.paymentReminders && (
                  <div className="ml-4 space-y-2">
                    <Label htmlFor="reminderDays">Remind me this many days before</Label>
                    <Select
                      id="reminderDays"
                      value={String(settings?.notifications?.paymentReminderDays || 3)}
                      onChange={(e) => updateNotificationSetting('paymentReminderDays', Number(e.target.value))}
                    >
                      <option value="1">1 day</option>
                      <option value="2">2 days</option>
                      <option value="3">3 days</option>
                      <option value="5">5 days</option>
                      <option value="7">7 days</option>
                    </Select>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Price Change Alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified when subscription prices change.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.priceChangeAlerts ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('priceChangeAlerts', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Free Trial Ending Alerts</p>
                    <p className="text-xs text-muted-foreground">Get alerted before your free trials end.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.freeTrialEndingAlerts ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('freeTrialEndingAlerts', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Weekly Summary</p>
                    <p className="text-xs text-muted-foreground">Get a summary of your subscription activity every week.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.weeklySummary ?? false}
                    onCheckedChange={(checked) => updateNotificationSetting('weeklySummary', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Monthly Summary</p>
                    <p className="text-xs text-muted-foreground">Receive a monthly spending report.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.monthlySummary ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('monthlySummary', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">New Feature Announcements</p>
                    <p className="text-xs text-muted-foreground">Stay updated with the latest features and improvements.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.newFeatures ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('newFeatures', checked)}
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods - For tracking subscription payments */}
          {activeTab === 'payments' && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                  <CardDescription>Track the payment methods you use for your subscriptions.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPaymentDialog(true)}>
                  <Plus className="w-4 h-4" />
                  Add New Method
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings?.payments?.paymentMethods && settings.payments.paymentMethods.length > 0 ? (
                  settings.payments.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-6 rounded flex items-center justify-center text-white text-xs font-bold",
                          method.type === 'credit_card' || method.type === 'debit_card' ? 'bg-blue-600' : 'bg-orange-500'
                        )}>
                          {method.type === 'credit_card' ? 'CARD' : method.type.toUpperCase().slice(0, 4)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{method.label}</p>
                          {method.lastFour && (
                            <p className="text-xs text-muted-foreground">
                              ****{method.lastFour} {method.expiryDate && `· Exp ${method.expiryDate}`}
                            </p>
                          )}
                        </div>
                        {method.isDefault && <Badge variant="success">Default</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary"
                            onClick={() => handleSetDefaultPaymentMethod(index)}
                            disabled={saving}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemovePaymentMethod(index)}
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No payment methods added yet.</p>
                    <p className="text-sm">Add a payment method to track your subscription payments.</p>
                  </div>
                )}
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Budget Alerts</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable Budget Alerts</p>
                      <p className="text-xs text-muted-foreground">Get alerted when approaching your budget limit.</p>
                    </div>
                    <Switch
                      checked={settings?.payments?.budgetAlerts ?? true}
                      onCheckedChange={(checked) => {
                        if (!settings) return
                        setSettings({
                          ...settings,
                          payments: { ...settings.payments, budgetAlerts: checked },
                        })
                      }}
                    />
                  </div>
                  {settings?.payments?.budgetAlerts && (
                    <div className="space-y-2">
                      <Label htmlFor="budgetThreshold">Alert at percentage of budget</Label>
                      <Select
                        id="budgetThreshold"
                        value={String(settings?.payments?.budgetAlertThreshold || 80)}
                        onChange={(e) => {
                          if (!settings) return
                          setSettings({
                            ...settings,
                            payments: { ...settings.payments, budgetAlertThreshold: Number(e.target.value) },
                          })
                        }}
                      >
                        <option value="50">50%</option>
                        <option value="70">70%</option>
                        <option value="80">80%</option>
                        <option value="90">90%</option>
                        <option value="100">100%</option>
                      </Select>
                    </div>
                  )}
                  <div className="pt-4">
                    <Button onClick={handleSavePayments} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Payment Settings'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>Adjust application-wide settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      id="theme"
                      value={settings?.general?.theme || 'system'}
                      onChange={(e) => updateGeneralSetting('theme', e.target.value)}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      id="language"
                      value={settings?.general?.language || 'en'}
                      onChange={(e) => updateGeneralSetting('language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="pt">Portuguese</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zh-CN">Chinese (Simplified)</option>
                      <option value="vi">Vietnamese</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      id="dateFormat"
                      value={settings?.general?.dateFormat || 'MM/DD/YYYY'}
                      onChange={(e) => updateGeneralSetting('dateFormat', e.target.value)}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startOfWeek">Start of Week</Label>
                    <Select
                      id="startOfWeek"
                      value={settings?.general?.startOfWeek || 'sunday'}
                      onChange={(e) => updateGeneralSetting('startOfWeek', e.target.value)}
                    >
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Compact View</p>
                    <p className="text-xs text-muted-foreground">Use a more compact layout for subscription lists.</p>
                  </div>
                  <Switch
                    checked={settings?.general?.compactView ?? false}
                    onCheckedChange={(checked) => updateGeneralSetting('compactView', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show Cancelled Subscriptions</p>
                    <p className="text-xs text-muted-foreground">Display cancelled subscriptions in your lists.</p>
                  </div>
                  <Switch
                    checked={settings?.general?.showCancelledSubscriptions ?? false}
                    onCheckedChange={(checked) => updateGeneralSetting('showCancelledSubscriptions', checked)}
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={handleSaveGeneral} disabled={saving}>
                    {saving ? 'Saving...' : 'Save General Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Privacy Settings</CardTitle>
                <CardDescription>Manage your privacy preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Share Data with Household</p>
                    <p className="text-xs text-muted-foreground">Allow household members to see your subscriptions.</p>
                  </div>
                  <Switch
                    checked={settings?.privacy?.shareDataWithHousehold ?? true}
                    onCheckedChange={(checked) => updatePrivacySetting('shareDataWithHousehold', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Analytics</p>
                    <p className="text-xs text-muted-foreground">Help improve the app by sharing anonymous usage data.</p>
                  </div>
                  <Switch
                    checked={settings?.privacy?.analyticsEnabled ?? true}
                    onCheckedChange={(checked) => updatePrivacySetting('analyticsEnabled', checked)}
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={handleSavePrivacy} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Privacy Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </main>

      {/* Add Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                id="paymentType"
                value={newPaymentMethod.type}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as 'credit_card' | 'debit_card' | 'paypal' | 'bank_account' | 'apple_pay' | 'google_pay' })}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_account">Bank Account</option>
                <option value="apple_pay">Apple Pay</option>
                <option value="google_pay">Google Pay</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentLabel">Label *</Label>
              <Input
                id="paymentLabel"
                placeholder="e.g., Visa Personal Card"
                value={newPaymentMethod.label}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastFour">Last 4 Digits *</Label>
                <Input
                  id="lastFour"
                  placeholder="1234"
                  maxLength={4}
                  value={newPaymentMethod.lastFour}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setNewPaymentMethod({ ...newPaymentMethod, lastFour: value })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={newPaymentMethod.expiryDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4)
                    }
                    setNewPaymentMethod({ ...newPaymentMethod, expiryDate: value })
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPaymentMethod} disabled={saving}>
              {saving ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Preview Dialog */}
      <Dialog open={showUpgradePreview} onOpenChange={(open) => {
        setShowUpgradePreview(open)
        if (!open) {
          setUpgradePreview(null)
          setSelectedUpgradePlan(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Plan Change</DialogTitle>
          </DialogHeader>
          <div className="py-4 px-4">
            {loadingPreview ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Calculating your upgrade cost...</p>
              </div>
            ) : upgradePreview ? (
              <div className="space-y-6">
                {/* Plan Change Summary */}
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                    <p className="font-bold">{upgradePreview.currentPlan?.name || 'Free'}</p>
                    {upgradePreview.currentPlan && (
                      <p className="text-sm text-muted-foreground">
                        ${(upgradePreview.currentPlan.price / 100).toFixed(2)}/{upgradePreview.currentPlan.billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </p>
                    )}
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground mb-1">New Plan</p>
                    <p className="font-bold text-primary">{upgradePreview.targetPlan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${(upgradePreview.targetPlan.price / 100).toFixed(2)}
                      {upgradePreview.targetPlan.billingCycle === 'monthly' && '/mo'}
                      {upgradePreview.targetPlan.billingCycle === 'yearly' && '/yr'}
                      {upgradePreview.targetPlan.billingCycle === 'lifetime' && ' one-time'}
                    </p>
                  </div>
                </div>

                {/* Proration Details - Only show for plan changes with proration */}
                {upgradePreview.upgradeType === 'plan_change' && upgradePreview.proration.credit > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      Proration Details
                      {upgradePreview.proration.isEstimate && (
                        <Badge variant="secondary" className="text-xs">Estimate</Badge>
                      )}
                    </h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Days remaining on current plan</span>
                      <span>{upgradePreview.proration.daysRemaining} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credit from unused time</span>
                      <span className="text-green-600">~${(upgradePreview.proration.credit / 100).toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Estimated amount due</span>
                      <span className="text-lg">~${(upgradePreview.proration.amountDue / 100).toFixed(2)}</span>
                    </div>
                    {upgradePreview.proration.isEstimate && (
                      <p className="text-xs text-muted-foreground">
                        * Final amount calculated by Polar at checkout
                      </p>
                    )}
                  </div>
                )}

                {/* Lifetime purchase - Full price, no proration */}
                {upgradePreview.upgradeType === 'immediate_charge' && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>Amount due today</span>
                      <span className="text-lg">${(upgradePreview.proration.amountDue / 100).toFixed(2)}</span>
                    </div>
                    {upgradePreview.currentPlan && (
                      <p className="text-xs text-muted-foreground">
                        Your current {upgradePreview.currentPlan.name} subscription will be cancelled.
                      </p>
                    )}
                  </div>
                )}

                {/* New subscription - Full price */}
                {upgradePreview.upgradeType === 'new_subscription' && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between font-medium">
                      <span>Amount due today</span>
                      <span className="text-lg">${(upgradePreview.proration.amountDue / 100).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Info message */}
                <p className="text-sm text-muted-foreground text-center">
                  {upgradePreview.message}
                </p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Unable to load upgrade preview.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradePreview(false)} disabled={upgradingPlan !== null}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpgrade}
              disabled={loadingPreview || !upgradePreview || upgradingPlan !== null}
            >
              {upgradingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${upgradePreview?.targetPlan.billingCycle === 'lifetime' ? 'Purchase' : 'Upgrade'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
