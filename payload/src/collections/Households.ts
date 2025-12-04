import type { CollectionConfig } from 'payload'

export const Households: CollectionConfig = {
  slug: 'households',
  admin: {
    useAsTitle: 'name',
    group: 'Households',
    defaultColumns: ['name', 'owner', 'createdAt'],
  },
  access: {
    // Users can only read households they are members of
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
        id: { in: householdIds },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Only owner or admin members can update
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
      if (householdIds.length === 0) return false

      return {
        id: { in: householdIds },
      }
    },
    delete: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      // Only owner can delete
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
      if (householdIds.length === 0) return false

      return {
        id: { in: householdIds },
      }
    },
  },
  hooks: {
    afterChange: [
      // Create owner membership after household creation
      async ({ doc, operation, req }) => {
        if (operation === 'create' && req.user) {
          await req.payload.create({
            collection: 'household-members',
            data: {
              household: doc.id,
              user: req.user.id,
              role: 'owner',
            },
          })
        }
        return doc
      },
    ],
  },
  fields: [
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
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      defaultValue: ({ user }) => user?.id,
      admin: {
        condition: (data, siblingData, { user }) => user?.role === 'admin',
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
      admin: {
        description: 'Default currency for household subscriptions',
      },
    },
    {
      name: 'inviteCode',
      type: 'text',
      unique: true,
      admin: {
        description: 'Shareable code to invite new members',
        readOnly: true,
      },
    },
    {
      name: 'inviteCodeExpiry',
      type: 'date',
      admin: {
        description: 'When the invite code expires',
      },
    },
  ],
  timestamps: true,
}
