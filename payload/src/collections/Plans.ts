import type { CollectionConfig } from 'payload'

export const Plans: CollectionConfig = {
  slug: 'plans',
  admin: {
    useAsTitle: 'name',
    group: 'Billing',
    description: 'Subscription plans available for users',
  },
  access: {
    read: () => true, // Plans are public
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique identifier: free, pro, lifetime',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price in cents (e.g., 999 = $9.99)',
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'USD',
    },
    {
      name: 'billingCycle',
      type: 'select',
      required: true,
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
        { label: 'Lifetime', value: 'lifetime' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this plan is available for purchase',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display order (lower = first)',
      },
    },
    // Feature Limits
    {
      name: 'limits',
      type: 'group',
      admin: {
        description: 'Usage limits for this plan',
      },
      fields: [
        {
          name: 'maxSubscriptions',
          type: 'number',
          defaultValue: 5,
          admin: {
            description: 'Maximum number of subscriptions (-1 = unlimited)',
          },
        },
        {
          name: 'maxHouseholds',
          type: 'number',
          defaultValue: 1,
          admin: {
            description: 'Maximum number of households (-1 = unlimited)',
          },
        },
        {
          name: 'maxHouseholdMembers',
          type: 'number',
          defaultValue: 2,
          admin: {
            description: 'Maximum members per household (-1 = unlimited)',
          },
        },
      ],
    },
    // Feature Flags
    {
      name: 'features',
      type: 'group',
      admin: {
        description: 'Features enabled for this plan',
      },
      fields: [
        {
          name: 'advancedAnalytics',
          type: 'checkbox',
          defaultValue: false,
          label: 'Advanced Analytics & Insights',
        },
        {
          name: 'aiAssistant',
          type: 'checkbox',
          defaultValue: false,
          label: 'AI Assistant (Quick Entry)',
        },
        {
          name: 'smartNotifications',
          type: 'checkbox',
          defaultValue: false,
          label: 'Smart Renewal Notifications',
        },
        {
          name: 'emailAlerts',
          type: 'checkbox',
          defaultValue: false,
          label: 'Email Alerts',
        },
        {
          name: 'pushAlerts',
          type: 'checkbox',
          defaultValue: false,
          label: 'Push Notifications',
        },
        {
          name: 'discordAlerts',
          type: 'checkbox',
          defaultValue: false,
          label: 'Discord Alerts',
        },
        {
          name: 'priceAlerts',
          type: 'checkbox',
          defaultValue: false,
          label: 'Price Hike Alerts',
        },
      ],
    },
    // Stripe/Payment Integration
    {
      name: 'stripeProductId',
      type: 'text',
      admin: {
        description: 'Stripe Product ID',
        position: 'sidebar',
      },
    },
    {
      name: 'stripePriceId',
      type: 'text',
      admin: {
        description: 'Stripe Price ID',
        position: 'sidebar',
      },
    },
  ],
}
