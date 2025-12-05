'use client'

import React, { useState } from 'react'
import { User, Bell, CreditCard, Settings as SettingsIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const settingsTabs = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'general', label: 'General', icon: SettingsIcon },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account')
  const [fullName, setFullName] = useState('Alex Doe')
  const [email, setEmail] = useState('alex.doe@email.com')
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    paymentReminders: true,
    newFeatures: true,
    weeklySummary: false,
  })
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('en')

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* Settings Sidebar */}
      <aside className="w-56 p-4 border-r border-border hidden lg:block">
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
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
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

          {/* Account Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Account Settings</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="link" className="text-destructive hover:text-destructive/80">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Upcoming Payment Reminders</p>
                  <p className="text-xs text-muted-foreground">Receive alerts before your subscriptions are due.</p>
                </div>
                <Switch
                  checked={notifications.paymentReminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, paymentReminders: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New Feature Announcements</p>
                  <p className="text-xs text-muted-foreground">Stay updated with the latest features and improvements.</p>
                </div>
                <Switch
                  checked={notifications.newFeatures}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, newFeatures: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Weekly Summary</p>
                  <p className="text-xs text-muted-foreground">Get a summary of your subscription activity every week.</p>
                </div>
                <Switch
                  checked={notifications.weeklySummary}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklySummary: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <CardDescription>Add and manage your payment methods.</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Add New Method
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <p className="text-sm font-medium">Visa ending in 4242</p>
                  <Badge variant="success">Default</Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Remove
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 rounded bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    MC
                  </div>
                  <p className="text-sm font-medium">Mastercard ending in 8989</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="link" size="sm" className="text-primary">
                    Set as Default
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">General Settings</CardTitle>
              <CardDescription>Adjust application-wide settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select id="theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
