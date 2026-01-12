import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { calculateNextBillingDate, type BillingCycle } from '../lib/billing'

/**
 * Before change hook to auto-calculate nextBillingDate
 * - On create: calculate from startDate if nextBillingDate not provided
 * - On update: recalculate if startDate, billingCycle, or frequency changed
 */
const autoCalculateNextBillingDate: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  const startDate = data.startDate
  const billingCycle = data.billingCycle as BillingCycle
  const frequency = data.frequency || 1

  if (operation === 'create') {
    // On create, calculate nextBillingDate if not provided
    if (!data.nextBillingDate && startDate && billingCycle) {
      data.nextBillingDate = calculateNextBillingDate(
        new Date(startDate),
        billingCycle,
        frequency,
      ).toISOString()
    }
  } else if (operation === 'update' && originalDoc) {
    // On update, recalculate if billing fields changed and nextBillingDate wasn't explicitly set
    const billingFieldsChanged =
      (data.startDate && data.startDate !== originalDoc.startDate) ||
      (data.billingCycle && data.billingCycle !== originalDoc.billingCycle) ||
      (data.frequency && data.frequency !== originalDoc.frequency)

    // Only auto-recalculate if billing fields changed and user didn't provide new nextBillingDate
    if (billingFieldsChanged && !data.nextBillingDate) {
      const effectiveStartDate = data.startDate || originalDoc.startDate
      const effectiveBillingCycle = (data.billingCycle || originalDoc.billingCycle) as BillingCycle
      const effectiveFrequency = data.frequency || originalDoc.frequency || 1

      if (effectiveStartDate && effectiveBillingCycle) {
        data.nextBillingDate = calculateNextBillingDate(
          new Date(effectiveStartDate),
          effectiveBillingCycle,
          effectiveFrequency,
        ).toISOString()
      }
    }
  }

  return data
}

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
    defaultColumns: ['name', 'amount', 'billingCycle', 'nextBillingDate', 'category'],
  },
  hooks: {
    beforeChange: [autoCalculateNextBillingDate],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { owner: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { owner: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { owner: { equals: user.id } }
    },
  },
  fields: [
    // Owner
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      defaultValue: ({ user }) => user?.id,
    },

    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
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
    },
    {
      name: 'logo',
      type: 'text',
      admin: {
        description: 'Logo URL',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },

    // Pricing
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
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
      ],
      defaultValue: 'USD',
    },

    // Billing
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
      name: 'frequency',
      type: 'number',
      min: 1,
      defaultValue: 1,
      admin: {
        description: 'Every X billing cycles (e.g., every 3 months)',
      },
    },

    // Promo
    {
      name: 'promoPrice',
      type: 'number',
      min: 0,
    },
    {
      name: 'promoEndDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // Dates
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
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
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'freeTrialEndDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // Settings
    {
      name: 'autoRenew',
      type: 'checkbox',
      defaultValue: true,
    },

    // Extra
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

    // Reminder
    {
      name: 'reminderDate',
      type: 'date',
      admin: {
        description: 'When to send reminder',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // Household
    {
      name: 'household',
      type: 'relationship',
      relationTo: 'households',
      hasMany: false,
    },

    // Member Share
    {
      name: 'memberShare',
      type: 'array',
      admin: {
        description: 'Split subscription costs with members',
      },
      fields: [
        {
          name: 'member',
          type: 'relationship',
          relationTo: 'members',
          required: true,
        },
        {
          name: 'sharePercentage',
          type: 'number',
          min: 0,
          max: 100,
          required: true,
          admin: {
            description: 'Percentage of the subscription this member pays',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
