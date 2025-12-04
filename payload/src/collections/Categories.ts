import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
    defaultColumns: ['name', 'icon', 'color', 'createdAt'],
  },
  access: {
    // Categories are readable by all authenticated users
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
        description: 'Icon name (e.g., "movie", "music", "cloud")',
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
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Pre-populated categories that come with the app',
      },
    },
  ],
  timestamps: true,
}
