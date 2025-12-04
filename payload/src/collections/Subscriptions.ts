import type { CollectionConfig } from 'payload'
import {
  calculateNextPaymentDateHook,
  recordPriceChangeHook,
  createInitialPriceRecordHook,
} from '../hooks/subscriptions'
import { autoLogoHook } from '../hooks/auto-logo'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
    defaultColumns: ['name', 'price', 'frequency', 'nextPaymentDate', 'category'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [calculateNextPaymentDateHook, autoLogoHook],
    afterChange: [recordPriceChangeHook, createInitialPriceRecordHook],
  },
  fields: [
    // Owner (auto-set, hidden for non-admin)
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        condition: (data, siblingData, { user }) => user?.role === 'admin',
      },
      defaultValue: ({ user }) => user?.id,
    },

    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Subscription service name (e.g., Netflix, Spotify)',
      },
    },
    {
      name: 'logoUrl',
      type: 'text',
      admin: {
        description: 'Click "Auto-fetch" to get logo from service name or URL',
        components: {
          Field: '@/components/LogoField',
        },
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Website URL for the subscription service',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
    },

    // Pricing
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price per billing cycle',
      },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      options: [
        { label: 'USD ($)', value: 'USD' },
        { label: 'EUR (€)', value: 'EUR' },
        { label: 'GBP (£)', value: 'GBP' },
        { label: 'JPY (¥)', value: 'JPY' },
        { label: 'CAD (C$)', value: 'CAD' },
        { label: 'AUD (A$)', value: 'AUD' },
        { label: 'INR (₹)', value: 'INR' },
        { label: 'KRW (₩)', value: 'KRW' },
        { label: 'BRL (R$)', value: 'BRL' },
        { label: 'MXN (MX$)', value: 'MXN' },
        { label: 'VND (₫)', value: 'VND' },
        { label: 'THB (฿)', value: 'THB' },
        { label: 'SGD (S$)', value: 'SGD' },
        { label: 'CHF (Fr)', value: 'CHF' },
        { label: 'CNY (¥)', value: 'CNY' },
      ],
      defaultValue: 'USD',
    },

    // Billing Frequency
    {
      name: 'paymentEvery',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
      admin: {
        description: 'Payment interval (e.g., every 1, 2, 3...)',
      },
    },
    {
      name: 'frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Day(s)', value: 'days' },
        { label: 'Week(s)', value: 'weeks' },
        { label: 'Month(s)', value: 'months' },
        { label: 'Year(s)', value: 'years' },
      ],
      defaultValue: 'months',
    },
    {
      name: 'autoRenew',
      type: 'checkbox',
      defaultValue: true,
      label: 'Auto Renewal',
    },

    // Status
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Trial', value: 'trial' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'trialEndDate',
      type: 'date',
      admin: {
        condition: (data) => data?.status === 'trial',
        description: 'When the free trial ends',
      },
    },

    // Dates
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        description: 'When the subscription started',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'nextPaymentDate',
      type: 'date',
      admin: {
        description: 'Calculated automatically based on frequency',
        readOnly: true,
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // Payment Info
    {
      name: 'paymentMethod',
      type: 'select',
      options: [
        { label: 'Credit Card', value: 'credit_card' },
        { label: 'Debit Card', value: 'debit_card' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Bank Transfer', value: 'bank_transfer' },
        { label: 'Apple Pay', value: 'apple_pay' },
        { label: 'Google Pay', value: 'google_pay' },
        { label: 'Crypto', value: 'crypto' },
        { label: 'Gift Card', value: 'gift_card' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'paidBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        description: 'Who pays for this subscription',
      },
    },

    // Household (for split billing)
    {
      name: 'household',
      type: 'relationship',
      relationTo: 'households',
      hasMany: false,
      admin: {
        description: 'Household for split billing',
      },
    },

    // Notifications
    {
      name: 'enableNotification',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable Notifications',
    },
    {
      name: 'notifyBefore',
      type: 'number',
      min: 1,
      max: 30,
      defaultValue: 3,
      admin: {
        description: 'Days before payment to notify',
        condition: (data) => data?.enableNotification === true,
      },
    },

    // Additional Info
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Any additional notes',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },

    // Internal fields (sidebar)
    {
      name: 'notifiedForCurrentCycle',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Notification sent for current cycle?',
        position: 'sidebar',
      },
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Screenshot Import', value: 'screenshot' },
        { label: 'Email Import', value: 'email' },
        { label: 'Voice Entry', value: 'voice' },
      ],
      defaultValue: 'manual',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
