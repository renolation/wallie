import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'

const createUserSettings: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create') {
    try {
      const existingSettings = await req.payload.find({
        collection: 'user-settings',
        where: { user: { equals: doc.id } },
        limit: 1,
        req,
      })

      if (existingSettings.totalDocs === 0) {
        await req.payload.create({
          collection: 'user-settings',
          data: {
            user: doc.id,
          },
          req,
        })
      }
    } catch (error) {
      console.error('Failed to create user settings:', error)
    }
  }
  return doc
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Core',
    defaultColumns: ['email', 'firstName', 'lastName', 'roles', 'createdAt'],
  },
  auth: true,
  hooks: {
    afterChange: [createUserSettings],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: ['user'],
      required: true,
    },
    {
      name: 'budget',
      type: 'number',
      min: 0,
      admin: {
        description: 'Monthly budget limit',
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
        { label: 'VND (₫)', value: 'VND' },
      ],
      defaultValue: 'USD',
    },
    {
      name: 'timezone',
      type: 'text',
      defaultValue: 'UTC',
      admin: {
        description: 'IANA timezone (e.g., "America/New_York")',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  timestamps: true,
}
