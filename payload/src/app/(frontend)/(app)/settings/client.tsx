'use client'

import React, { useState } from 'react'
import { User, Bell, CreditCard, Settings as SettingsIcon, Plus, Shield, Trash2 } from 'lucide-react'
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
}

export default function SettingsClient({ initialUser, initialSettings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState('account')
  const [saving, setSaving] = useState(false)
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

          {/* Payment Methods */}
          {activeTab === 'payments' && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                  <CardDescription>Add and manage your payment methods.</CardDescription>
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
    </div>
  )
}
