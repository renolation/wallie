import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
    defaultColumns: ['name', 'icon', 'color', 'createdAt'],
    hidden: ({ user }) => user?.role !== 'admin',
  },
  access: {
    // All authenticated users can read categories
    read: ({ req: { user } }) => Boolean(user),
    // Only admins can create/update/delete categories
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Icon name (e.g., "play-circle", "music", "cloud")',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code (e.g., "#FF5733")',
      },
    },
  ],
  timestamps: true,
}
