'use client'

import React, { useState } from 'react'
import { User, Bell, CreditCard, Settings as SettingsIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserSettings {
  fullName: string
  email: string
  notifications: {
    paymentReminders: boolean
    featureAnnouncements: boolean
    weeklySummary: boolean
  }
  paymentMethods: {
    id: string
    type: 'visa' | 'mastercard'
    last4: string
    isDefault: boolean
  }[]
  preferences: {
    theme: 'dark' | 'light' | 'system'
    language: string
  }
}

const tabs = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'general', label: 'General', icon: SettingsIcon },
]

const mockSettings: UserSettings = {
  fullName: 'Alex Doe',
  email: 'alex.doe@email.com',
  notifications: {
    paymentReminders: true,
    featureAnnouncements: true,
    weeklySummary: false,
  },
  paymentMethods: [
    { id: '1', type: 'visa', last4: '4242', isDefault: true },
    { id: '2', type: 'mastercard', last4: '8989', isDefault: false },
  ],
  preferences: {
    theme: 'dark',
    language: 'English',
  },
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account')
  const [settings, setSettings] = useState<UserSettings>(mockSettings)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  const toggleNotification = (key: keyof UserSettings['notifications']) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }))
  }

  return (
    <div className="flex min-h-screen">
      {/* Settings Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card p-6 hidden lg:flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
            {settings.fullName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h2 className="font-medium">{settings.fullName}</h2>
            <p className="text-muted-foreground text-sm">{settings.email}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight">Settings</h1>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-10">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="rounded-xl border border-border bg-card/50 p-6">
                <h2 className="text-xl font-bold mb-6">Account Settings</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={settings.fullName}
                      onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                      className="w-full rounded-lg border border-border bg-muted p-4 focus:border-primary focus:outline-none focus:ring-0 h-14"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full rounded-lg border border-border bg-muted p-4 focus:border-primary focus:outline-none focus:ring-0 h-14"
                    />
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-11 px-6 flex items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="text-sm font-medium text-red-500 hover:text-red-400">
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Notification Preferences */}
            {activeTab === 'notifications' && (
              <div className="rounded-xl border border-border bg-card/50 p-6">
                <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Upcoming Payment Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts before your subscriptions are due.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.paymentReminders}
                        onChange={() => toggleNotification('paymentReminders')}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Feature Announcements</p>
                      <p className="text-sm text-muted-foreground">
                        Stay updated with the latest features and improvements.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.featureAnnouncements}
                        onChange={() => toggleNotification('featureAnnouncements')}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Get a summary of your subscription activity every week.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.weeklySummary}
                        onChange={() => toggleNotification('weeklySummary')}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {activeTab === 'payments' && (
              <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold">Payment Methods</h2>
                  <button className="h-11 px-6 flex items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/80">
                    <Plus className="w-4 h-4" />
                    Add New Method
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {settings.paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                          {method.type === 'visa' ? 'VISA' : 'MC'}
                        </div>
                        <p className="font-medium">
                          {method.type === 'visa' ? 'Visa' : 'Mastercard'} ending in {method.last4}
                        </p>
                        {method.isDefault && (
                          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {!method.isDefault && (
                          <button className="text-sm font-medium text-primary hover:text-primary/80">
                            Set as Default
                          </button>
                        )}
                        <button className="text-sm font-medium text-muted-foreground hover:text-foreground">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="rounded-xl border border-border bg-card/50 p-6">
                <h2 className="text-xl font-bold mb-6">General Settings</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Theme</label>
                    <select
                      value={settings.preferences.theme}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          preferences: {
                            ...settings.preferences,
                            theme: e.target.value as 'dark' | 'light' | 'system',
                          },
                        })
                      }
                      className="w-full rounded-lg border border-border bg-muted p-4 focus:border-primary focus:outline-none focus:ring-0 h-14 cursor-pointer"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      value={settings.preferences.language}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          preferences: {
                            ...settings.preferences,
                            language: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-lg border border-border bg-muted p-4 focus:border-primary focus:outline-none focus:ring-0 h-14 cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
