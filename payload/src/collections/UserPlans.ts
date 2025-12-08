import type { CollectionConfig } from 'payload'

export const UserPlans: CollectionConfig = {
  slug: 'user-plans',
  admin: {
    useAsTitle: 'id',
    group: 'Billing',
    description: 'User subscription records',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    update: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    delete: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'plans',
      required: true,
      hasMany: false,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Expired', value: 'expired' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Trialing', value: 'trialing' },
      ],
      index: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'Null for lifetime plans',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'cancelledAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'trialEndsAt',
      type: 'date',
      admin: {
        description: 'Trial period end date',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    // Payment Provider Info
    {
      name: 'paymentProvider',
      type: 'select',
      options: [
        { label: 'Polar', value: 'polar' },
        { label: 'Apple App Store', value: 'apple' },
        { label: 'Google Play', value: 'google' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'externalSubscriptionId',
      type: 'text',
      admin: {
        description: 'Subscription ID from payment provider',
      },
    },
    {
      name: 'externalCustomerId',
      type: 'text',
      admin: {
        description: 'Customer ID from payment provider',
      },
    },
    // Metadata
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional data from payment provider',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Set expiration date based on billing cycle when creating
        if (operation === 'create' && data.plan) {
          // This would need to lookup the plan to get billing cycle
          // For now, just ensure startDate is set
          if (!data.startDate) {
            data.startDate = new Date().toISOString()
          }
        }
        return data
      },
    ],
  },
}
