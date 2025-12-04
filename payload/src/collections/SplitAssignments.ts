import type { CollectionConfig, Where } from 'payload'

export const SplitAssignments: CollectionConfig = {
  slug: 'split-assignments',
  admin: {
    useAsTitle: 'user',
    group: 'Households',
    defaultColumns: ['subscription', 'user', 'percentage', 'amount'],
  },
  access: {
    // Can read if you're part of the subscription's household
    read: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Get user's households
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

      // Build conditions
      const conditions: Where[] = [{ user: { equals: user.id } }]

      if (householdIds.length > 0) {
        // Get subscriptions in these households
        const subscriptions = await payload.find({
          collection: 'subscriptions',
          where: {
            household: { in: householdIds },
          },
          depth: 0,
        })

        const subscriptionIds = subscriptions.docs.map((s) => s.id)
        if (subscriptionIds.length > 0) {
          conditions.push({ subscription: { in: subscriptionIds } })
        }
      }

      return { or: conditions }
    },
    // Only payer of subscription or household owner/admin can create splits
    create: async ({ req: { user, payload }, data }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (!data?.subscription) return false

      const subscriptionId =
        typeof data.subscription === 'object' ? data.subscription.id : data.subscription

      const subscription = await payload.findByID({
        collection: 'subscriptions',
        id: subscriptionId,
        depth: 1,
      })

      if (!subscription) return false

      // Check if user is the payer
      const paidById =
        typeof subscription.paidBy === 'object'
          ? subscription.paidBy?.id
          : subscription.paidBy
      if (paidById === user.id) return true

      // Check if user is owner/admin of household
      if (subscription.household) {
        const householdId =
          typeof subscription.household === 'object'
            ? subscription.household.id
            : subscription.household

        const membership = await payload.find({
          collection: 'household-members',
          where: {
            user: { equals: user.id },
            household: { equals: householdId },
            role: { in: ['owner', 'admin'] },
          },
        })
        return membership.totalDocs > 0
      }

      return false
    },
    update: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Get subscriptions user has payer rights to
      const paidSubscriptions = await payload.find({
        collection: 'subscriptions',
        where: {
          paidBy: { equals: user.id },
        },
        depth: 0,
      })

      const allSubIds: number[] = paidSubscriptions.docs.map((s) => s.id)

      // Get households where user is owner/admin
      const memberships = await payload.find({
        collection: 'household-members',
        where: {
          user: { equals: user.id },
          role: { in: ['owner', 'admin'] },
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
        allSubIds.push(...householdSubs.docs.map((s) => s.id))
      }

      const uniqueSubIds = [...new Set(allSubIds)]
      if (uniqueSubIds.length === 0) return false

      return { subscription: { in: uniqueSubIds } }
    },
    delete: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Get subscriptions user has payer rights to
      const paidSubscriptions = await payload.find({
        collection: 'subscriptions',
        where: {
          paidBy: { equals: user.id },
        },
        depth: 0,
      })

      const allSubIds: number[] = paidSubscriptions.docs.map((s) => s.id)

      // Get households where user is owner/admin
      const memberships = await payload.find({
        collection: 'household-members',
        where: {
          user: { equals: user.id },
          role: { in: ['owner', 'admin'] },
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
        allSubIds.push(...householdSubs.docs.map((s) => s.id))
      }

      const uniqueSubIds = [...new Set(allSubIds)]
      if (uniqueSubIds.length === 0) return false

      return { subscription: { in: uniqueSubIds } }
    },
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
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'percentage',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: {
        description: 'Percentage of the subscription cost this user is responsible for',
      },
    },
    {
      name: 'amount',
      type: 'number',
      admin: {
        description: 'Calculated amount in cents (percentage * subscription price / 100)',
        readOnly: true,
      },
    },
    {
      name: 'isSettled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has this split been paid/settled for the current cycle?',
      },
    },
    {
      name: 'settledAt',
      type: 'date',
      admin: {
        condition: (data) => data?.isSettled,
        description: 'When this split was last settled',
      },
    },
  ],
  timestamps: true,
}
