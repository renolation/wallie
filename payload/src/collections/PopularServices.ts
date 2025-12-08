import type { CollectionConfig } from 'payload'

export const PopularServices: CollectionConfig = {
  slug: 'popular-services',
  admin: {
    useAsTitle: 'name',
    group: 'Reference Data',
    defaultColumns: ['position', 'name', 'description', 'logo'],
  },
  access: {
    // Public read access - no auth required
    read: () => true,
    // Only admins can modify
    create: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    update: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    delete: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
  },
  fields: [
    {
      name: 'position',
      type: 'number',
      required: true,
      admin: {
        description: 'Display order (lower = higher priority)',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'logo',
      type: 'text',
      admin: {
        description: 'URL to service logo',
      },
    },
    {
      name: 'altText',
      type: 'text',
      admin: {
        description: 'Alt text for the logo',
      },
    },
    {
      name: 'defaultCategory',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      admin: {
        description: 'Default category to assign when selecting this service',
      },
    },
    {
      name: 'suggestedPrice',
      type: 'number',
      admin: {
        description: 'Suggested price in cents (optional)',
      },
    },
    {
      name: 'suggestedBillingCycle',
      type: 'select',
      options: [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
      ],
      admin: {
        description: 'Suggested billing cycle (optional)',
      },
    },
  ],
  timestamps: true,
}
