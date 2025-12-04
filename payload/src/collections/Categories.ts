import type { CollectionConfig, Where } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
    defaultColumns: ['name', 'color', 'isPublic', 'owner', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      // Can read public categories or own categories
      return {
        or: [
          { isPublic: { equals: true } },
          { owner: { equals: user.id } },
        ],
      } as Where
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
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Make this category visible to all users',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code (e.g., "#FF5733")',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      defaultValue: ({ user }) => user?.id,
    },
  ],
  timestamps: true,
}
