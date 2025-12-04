import type { CollectionConfig, Where } from 'payload'

export const HouseholdMembers: CollectionConfig = {
  slug: 'household-members',
  admin: {
    useAsTitle: 'user',
    group: 'Households',
    defaultColumns: ['household', 'user', 'role', 'joinedAt'],
  },
  access: {
    // Can read if you're a member of the household
    read: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Find households where user is a member
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
      if (householdIds.length === 0) return false

      return {
        household: { in: householdIds },
      }
    },
    // Only owners/admins of the household can add members
    create: async ({ req: { user, payload }, data }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      if (!data?.household) return false

      const householdId =
        typeof data.household === 'object' ? data.household.id : data.household

      const membership = await payload.find({
        collection: 'household-members',
        where: {
          user: { equals: user.id },
          household: { equals: householdId },
          role: { in: ['owner', 'admin'] },
        },
        depth: 0,
      })

      return membership.totalDocs > 0
    },
    // Only owners/admins can update members (except users can update their own)
    update: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Get user's admin/owner memberships
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

      // Build where clause
      const conditions: Where[] = [{ user: { equals: user.id } }]

      if (householdIds.length > 0) {
        conditions.push({ household: { in: householdIds } })
      }

      return { or: conditions }
    },
    // Only owners can remove members (members can remove themselves)
    delete: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Get user's owner memberships
      const memberships = await payload.find({
        collection: 'household-members',
        where: {
          user: { equals: user.id },
          role: { equals: 'owner' },
        },
        depth: 0,
      })

      const householdIds = memberships.docs.map((m) =>
        typeof m.household === 'object' ? m.household.id : m.household,
      )

      // Build where clause
      const conditions: Where[] = [{ user: { equals: user.id } }]

      if (householdIds.length > 0) {
        conditions.push({ household: { in: householdIds } })
      }

      return { or: conditions }
    },
  },
  fields: [
    {
      name: 'household',
      type: 'relationship',
      relationTo: 'households',
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
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Admin', value: 'admin' },
        { label: 'Member', value: 'member' },
      ],
      defaultValue: 'member',
    },
    {
      name: 'nickname',
      type: 'text',
      admin: {
        description: 'Display name within this household',
      },
    },
    {
      name: 'joinedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'invitedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
