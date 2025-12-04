import type { CollectionConfig } from 'payload'
import {
  calculateNextPaymentDateHook,
  recordPriceChangeHook,
  createInitialPriceRecordHook,
} from '../hooks/subscriptions'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
    defaultColumns: ['name', 'price', 'billingCycle', 'nextPaymentDate', 'user'],
  },
  access: {
    // Users can only read their own subscriptions
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
    beforeChange: [calculateNextPaymentDateHook],
    afterChange: [recordPriceChangeHook, createInitialPriceRecordHook],
  },
  fields: [
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
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'logoUrl',
      type: 'text',
      admin: {
        description: 'External logo URL (fallback if no uploaded logo)',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price in cents (e.g., 999 = $9.99)',
      },
    },
    {
      name: 'currency',
      type: 'select',
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
      ],
      defaultValue: 'USD',
    },
    {
      name: 'billingCycle',
      type: 'select',
      required: true,
      options: [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Yearly', value: 'yearly' },
      ],
      defaultValue: 'monthly',
    },
    {
      name: 'firstPaymentDate',
      type: 'date',
      required: true,
      admin: {
        description: 'When the first payment was/will be made',
      },
    },
    {
      name: 'nextPaymentDate',
      type: 'date',
      admin: {
        description: 'Calculated automatically based on billing cycle',
        readOnly: true,
      },
    },
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
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
    },
    {
      name: 'household',
      type: 'relationship',
      relationTo: 'households',
      hasMany: false,
      admin: {
        description: 'Household this subscription belongs to (for split billing)',
      },
    },
    {
      name: 'paidBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        description: 'Who actually pays the bill (for split households)',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Website URL for the subscription service',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
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
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Screenshot Import', value: 'screenshot_import' },
        { label: 'Email Import', value: 'email_import' },
        { label: 'Voice Entry', value: 'voice_entry' },
      ],
      defaultValue: 'manual',
      admin: {
        description: 'How this subscription was added',
      },
    },
    {
      name: 'notifiedForCurrentCycle',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has the renewal notification been sent for the current cycle?',
        position: 'sidebar',
      },
    },
    {
      name: 'autoRenew',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Does this subscription auto-renew?',
      },
    },
    {
      name: 'cancellationUrl',
      type: 'text',
      admin: {
        description: 'Direct link to cancel the subscription',
      },
    },
  ],
  timestamps: true,
}
