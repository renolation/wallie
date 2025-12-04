import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
    defaultColumns: ['name', 'amount', 'billingCycle', 'nextBillingDate', 'category'],
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
