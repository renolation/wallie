import type { CollectionConfig } from 'payload'

export const PriceRecords: CollectionConfig = {
  slug: 'price-records',
  admin: {
    useAsTitle: 'subscription',
    group: 'Analytics',
    defaultColumns: ['subscription', 'price', 'recordedAt'],
  },
  access: {
    // Can read if you own the subscription
    read: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Get user's subscriptions
      const subscriptions = await payload.find({
        collection: 'subscriptions',
        where: {
          user: { equals: user.id },
        },
        depth: 0,
      })

      const subscriptionIds: number[] = subscriptions.docs.map((s) => s.id)

      // Also get household subscriptions
      const memberships = await payload.find({
        collection: 'household-members',
        where: {
          user: { equals: user.id },
        },
        depth: 0,
      })

      const householdIds = memberships.docs.map((m) =>
        typeof m.household === 'object' ? m.household.id : m.household,
      )

      if (householdIds.length > 0) {
        const householdSubs = await payload.find({
          collection: 'subscriptions',
          where: {
            household: { in: householdIds },
          },
          depth: 0,
        })

        subscriptionIds.push(...householdSubs.docs.map((s) => s.id))
      }

      if (subscriptionIds.length === 0) return false

      return { subscription: { in: [...new Set(subscriptionIds)] } }
    },
    // Only system/admin can create price records (created via hooks)
    create: () => true, // Allow hooks to create
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      required: true,
      hasMany: false,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      admin: {
        description: 'Price in cents at the time of recording',
      },
    },
    {
      name: 'previousPrice',
      type: 'number',
      admin: {
        description: 'Previous price in cents (if changed)',
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'USD',
    },
    {
      name: 'frequency',
      type: 'text',
      admin: {
        description: 'Billing frequency (e.g., monthly, yearly, every 2 weeks)',
      },
    },
    {
      name: 'recordedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'User Update', value: 'user_update' },
        { label: 'Auto Detection', value: 'auto_detection' },
        { label: 'Import', value: 'import' },
      ],
      defaultValue: 'user_update',
    },
    {
      name: 'changePercentage',
      type: 'number',
      admin: {
        description: 'Percentage change from previous price',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
