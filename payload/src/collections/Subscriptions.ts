import type { CollectionConfig } from 'payload'
import { calculateNextPaymentDateHook } from '../hooks/subscriptions'
import { autoLogoHook } from '../hooks/auto-logo'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
    defaultColumns: ['name', 'price', 'billingCycle', 'nextBillingDate', 'category'],
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

    // ===== BASIC INFO =====
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Subscription service name (e.g., Netflix, Spotify)',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
    },
    {
      name: 'websiteUrl',
      type: 'text',
      admin: {
        description: 'Website URL for the subscription service',
      },
    },
    {
      name: 'logo',
      type: 'text',
      admin: {
        description: 'Logo URL - Click "Auto-fetch" to get logo automatically',
        components: {
          Field: '@/components/LogoField',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of the subscription',
      },
    },

    // ===== PRICING =====
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Regular price per billing cycle',
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
    {
      name: 'promoPrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Promotional/discounted price (if any)',
      },
    },
    {
      name: 'promoEndDate',
      type: 'date',
      admin: {
        description: 'When the promotional price ends',
        condition: (data) => data?.promoPrice != null && data?.promoPrice > 0,
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // ===== BILLING CYCLE =====
    {
      name: 'billingCycle',
      type: 'select',
      required: true,
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
      ],
      defaultValue: 'monthly',
    },
    {
      name: 'repeatEvery',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
      admin: {
        description: 'Repeat every X cycles (e.g., every 1 month, every 3 months)',
      },
    },
    {
      name: 'isRecurring',
      type: 'checkbox',
      defaultValue: true,
      label: 'Recurring Subscription',
      admin: {
        description: 'Does this subscription auto-renew?',
      },
    },

    // ===== DATES =====
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
      name: 'nextBillingDate',
      type: 'date',
      admin: {
        description: 'Calculated automatically based on billing cycle',
        readOnly: true,
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // ===== FREE TRIAL =====
    {
      name: 'freeTrialDays',
      type: 'number',
      min: 0,
      admin: {
        description: 'Free trial period in days (0 = no trial)',
      },
    },
    {
      name: 'trialEndDate',
      type: 'date',
      admin: {
        description: 'When the free trial ends',
        condition: (data) => data?.freeTrialDays != null && data?.freeTrialDays > 0,
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // ===== TAGS & NOTES =====
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
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Any additional notes',
      },
    },

    // ===== REMINDER =====
    {
      name: 'reminder',
      type: 'group',
      admin: {
        description: 'Reminder settings',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enable Reminder',
        },
        {
          name: 'daysBefore',
          type: 'number',
          min: 1,
          max: 30,
          defaultValue: 3,
          admin: {
            description: 'Days before billing to remind',
            condition: (data, siblingData) => siblingData?.enabled === true,
          },
        },
      ],
    },

    // ===== FAMILY SHARING (placeholder for later) =====
    {
      name: 'familySharing',
      type: 'array',
      admin: {
        description: 'Share subscription costs with family members',
      },
      fields: [
        {
          name: 'member',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'Family member',
          },
        },
        {
          name: 'amount',
          type: 'number',
          min: 0,
          admin: {
            description: 'Amount they pay',
          },
        },
      ],
    },

    // ===== INTERNAL FIELDS (sidebar) =====
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Trial', value: 'trial' },
        { label: 'Paused', value: 'paused' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Expired', value: 'expired' },
      ],
      defaultValue: 'active',
      admin: {
        position: 'sidebar',
      },
    },
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
