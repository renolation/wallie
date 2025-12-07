import type { CollectionConfig } from 'payload'

export const UserSettings: CollectionConfig = {
  slug: 'user-settings',
  admin: {
    useAsTitle: 'user',
    group: 'Core',
    defaultColumns: ['user', 'theme', 'language', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.roles?.includes('admin') || false
    },
  },
  fields: [
    // User relationship (one-to-one)
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      hasMany: false,
      admin: {
        description: 'The user this settings belongs to',
      },
    },

    // ============ ACCOUNT SETTINGS ============
    {
      name: 'account',
      type: 'group',
      fields: [
        {
          name: 'displayName',
          type: 'text',
          admin: {
            description: 'Display name (overrides firstName lastName)',
          },
        },
        {
          name: 'bio',
          type: 'textarea',
          admin: {
            description: 'Short bio or description',
          },
        },
        {
          name: 'phoneNumber',
          type: 'text',
        },
        {
          name: 'twoFactorEnabled',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable two-factor authentication',
          },
        },
      ],
    },

    // ============ NOTIFICATION SETTINGS ============
    {
      name: 'notifications',
      type: 'group',
      fields: [
        {
          name: 'paymentReminders',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Receive alerts before subscriptions are due',
          },
        },
        {
          name: 'paymentReminderDays',
          type: 'number',
          defaultValue: 3,
          min: 1,
          max: 30,
          admin: {
            description: 'Days before payment to send reminder',
          },
        },
        {
          name: 'priceChangeAlerts',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Get notified when subscription prices change',
          },
        },
        {
          name: 'freeTrialEndingAlerts',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Alert before free trials end',
          },
        },
        {
          name: 'weeklySummary',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Receive weekly spending summary',
          },
        },
        {
          name: 'monthlySummary',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Receive monthly spending report',
          },
        },
        {
          name: 'newFeatures',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Stay updated with new features',
          },
        },
        {
          name: 'emailNotifications',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Receive notifications via email',
          },
        },
        {
          name: 'pushNotifications',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Receive push notifications',
          },
        },
      ],
    },

    // ============ PAYMENT SETTINGS ============
    {
      name: 'payments',
      type: 'group',
      fields: [
        {
          name: 'defaultPaymentMethod',
          type: 'text',
          admin: {
            description: 'Default payment method ID (from payment provider)',
          },
        },
        {
          name: 'paymentMethods',
          type: 'array',
          admin: {
            description: 'Saved payment methods',
          },
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [
                { label: 'Credit Card', value: 'credit_card' },
                { label: 'Debit Card', value: 'debit_card' },
                { label: 'PayPal', value: 'paypal' },
                { label: 'Bank Account', value: 'bank_account' },
                { label: 'Apple Pay', value: 'apple_pay' },
                { label: 'Google Pay', value: 'google_pay' },
              ],
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              admin: {
                description: 'Display label (e.g., "Visa ending in 4242")',
              },
            },
            {
              name: 'lastFour',
              type: 'text',
              admin: {
                description: 'Last 4 digits of card/account',
              },
            },
            {
              name: 'expiryDate',
              type: 'text',
              admin: {
                description: 'Expiry date (MM/YY)',
              },
            },
            {
              name: 'isDefault',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'providerToken',
              type: 'text',
              admin: {
                description: 'Payment provider token/ID',
                hidden: true,
              },
            },
          ],
        },
        {
          name: 'budgetAlerts',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Get alerted when approaching budget limit',
          },
        },
        {
          name: 'budgetAlertThreshold',
          type: 'number',
          defaultValue: 80,
          min: 50,
          max: 100,
          admin: {
            description: 'Percentage of budget to trigger alert',
          },
        },
      ],
    },

    // ============ GENERAL SETTINGS ============
    {
      name: 'general',
      type: 'group',
      fields: [
        {
          name: 'theme',
          type: 'select',
          defaultValue: 'system',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'System', value: 'system' },
          ],
        },
        {
          name: 'language',
          type: 'select',
          defaultValue: 'en',
          options: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' },
            { label: 'Portuguese', value: 'pt' },
            { label: 'Japanese', value: 'ja' },
            { label: 'Korean', value: 'ko' },
            { label: 'Chinese (Simplified)', value: 'zh-CN' },
            { label: 'Vietnamese', value: 'vi' },
          ],
        },
        {
          name: 'dateFormat',
          type: 'select',
          defaultValue: 'MM/DD/YYYY',
          options: [
            { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
          ],
        },
        {
          name: 'startOfWeek',
          type: 'select',
          defaultValue: 'sunday',
          options: [
            { label: 'Sunday', value: 'sunday' },
            { label: 'Monday', value: 'monday' },
          ],
        },
        {
          name: 'compactView',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Use compact view for subscription lists',
          },
        },
        {
          name: 'showCancelledSubscriptions',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Show cancelled subscriptions in lists',
          },
        },
      ],
    },

    // ============ PRIVACY SETTINGS ============
    {
      name: 'privacy',
      type: 'group',
      fields: [
        {
          name: 'shareDataWithHousehold',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Allow household members to see your subscriptions',
          },
        },
        {
          name: 'analyticsEnabled',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Help improve the app by sharing anonymous usage data',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
