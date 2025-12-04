import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Core',
    defaultColumns: ['email', 'name', 'role', 'createdAt'],
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: 'user',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
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
      name: 'notificationPreferences',
      type: 'group',
      fields: [
        {
          name: 'renewalReminders',
          type: 'checkbox',
          defaultValue: true,
          label: 'Renewal Reminders',
        },
        {
          name: 'reminderDaysBefore',
          type: 'number',
          defaultValue: 3,
          min: 1,
          max: 30,
          admin: {
            description: 'Days before renewal to send reminder',
          },
        },
        {
          name: 'priceChangeAlerts',
          type: 'checkbox',
          defaultValue: true,
          label: 'Price Change Alerts',
        },
        {
          name: 'weeklyDigest',
          type: 'checkbox',
          defaultValue: false,
          label: 'Weekly Spending Digest',
        },
        {
          name: 'pushEnabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Push Notifications',
        },
        {
          name: 'emailEnabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Email Notifications',
        },
      ],
    },
    {
      name: 'deviceTokens',
      type: 'array',
      admin: {
        description: 'FCM device tokens for push notifications',
      },
      fields: [
        {
          name: 'token',
          type: 'text',
          required: true,
        },
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'iOS', value: 'ios' },
            { label: 'Android', value: 'android' },
            { label: 'Web', value: 'web' },
          ],
        },
        {
          name: 'lastUsed',
          type: 'date',
        },
      ],
    },
  ],
  timestamps: true,
}
