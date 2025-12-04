import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    group: 'System',
    defaultColumns: ['title', 'type', 'user', 'status', 'createdAt'],
  },
  access: {
    // Users can only read their own notifications
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    // Only system/admin can create notifications
    create: ({ req: { user } }) => user?.role === 'admin',
    // Users can update their own notifications (to mark as read)
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    // Users can delete their own notifications
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Renewal Reminder', value: 'renewal_reminder' },
        { label: 'Price Change', value: 'price_change' },
        { label: 'Trial Ending', value: 'trial_ending' },
        { label: 'Payment Failed', value: 'payment_failed' },
        { label: 'Household Invite', value: 'household_invite' },
        { label: 'Settlement Request', value: 'settlement_request' },
        { label: 'Weekly Digest', value: 'weekly_digest' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      hasMany: false,
      admin: {
        description: 'Related subscription (if applicable)',
      },
    },
    {
      name: 'household',
      type: 'relationship',
      relationTo: 'households',
      hasMany: false,
      admin: {
        description: 'Related household (if applicable)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Read', value: 'read' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'priority',
      type: 'select',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
      ],
      defaultValue: 'normal',
    },
    {
      name: 'channels',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Push', value: 'push' },
        { label: 'Email', value: 'email' },
        { label: 'In-App', value: 'in_app' },
      ],
      defaultValue: ['in_app'],
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        condition: (data) => data?.status === 'sent',
        readOnly: true,
      },
    },
    {
      name: 'readAt',
      type: 'date',
      admin: {
        condition: (data) => data?.status === 'read',
      },
    },
    {
      name: 'error',
      type: 'textarea',
      admin: {
        condition: (data) => data?.status === 'failed',
        description: 'Error message if notification failed to send',
        readOnly: true,
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional data for the notification',
      },
    },
    {
      name: 'actionUrl',
      type: 'text',
      admin: {
        description: 'Deep link or URL to navigate when notification is tapped',
      },
    },
  ],
  timestamps: true,
}
