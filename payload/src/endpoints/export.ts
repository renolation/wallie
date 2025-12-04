import type { Endpoint } from 'payload'

/**
 * Format frequency for display
 */
function formatFrequency(paymentEvery: number, frequency: string): string {
  if (paymentEvery === 1) {
    switch (frequency) {
      case 'days':
        return 'daily'
      case 'weeks':
        return 'weekly'
      case 'months':
        return 'monthly'
      case 'years':
        return 'yearly'
    }
  }
  return `every ${paymentEvery} ${frequency}`
}

/**
 * Data Export Endpoint
 * GET /api/export/data?format=json|csv
 *
 * Exports all user's subscription data
 */
export const exportDataEndpoint: Endpoint = {
  path: '/export/data',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url || '', 'http://localhost')
    const format = url.searchParams.get('format') || 'json'

    try {
      // Fetch user's subscriptions
      const subscriptions = await req.payload.find({
        collection: 'subscriptions',
        where: {
          user: { equals: req.user.id },
        },
        depth: 1,
        limit: 1000,
      })

      // Transform data for export
      const exportData = subscriptions.docs.map((sub) => ({
        id: sub.id,
        name: sub.name,
        logoUrl: sub.logoUrl || '',
        url: sub.url || '',
        price: sub.price,
        currency: sub.currency || 'USD',
        paymentEvery: sub.paymentEvery || 1,
        frequency: sub.frequency || 'months',
        frequencyLabel: formatFrequency(sub.paymentEvery || 1, sub.frequency || 'months'),
        status: sub.status || 'active',
        autoRenew: sub.autoRenew,
        category: typeof sub.category === 'object' ? sub.category?.name : '',
        startDate: sub.startDate,
        nextPaymentDate: sub.nextPaymentDate,
        paymentMethod: sub.paymentMethod || '',
        enableNotification: sub.enableNotification,
        notifyBefore: sub.notifyBefore || 3,
        notes: sub.notes || '',
        tags: sub.tags?.map((t) => t.tag).join(', ') || '',
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      }))

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'ID',
          'Name',
          'Logo URL',
          'Website URL',
          'Price',
          'Currency',
          'Payment Every',
          'Frequency',
          'Billing Cycle',
          'Status',
          'Auto Renew',
          'Category',
          'Start Date',
          'Next Payment Date',
          'Payment Method',
          'Notifications',
          'Notify Before (days)',
          'Notes',
          'Tags',
          'Created At',
          'Updated At',
        ]

        const csvRows = [
          headers.join(','),
          ...exportData.map((row) =>
            [
              row.id,
              `"${(row.name || '').replace(/"/g, '""')}"`,
              `"${(row.logoUrl || '').replace(/"/g, '""')}"`,
              `"${(row.url || '').replace(/"/g, '""')}"`,
              row.price,
              row.currency,
              row.paymentEvery,
              row.frequency,
              row.frequencyLabel,
              row.status,
              row.autoRenew ? 'Yes' : 'No',
              `"${(row.category || '').replace(/"/g, '""')}"`,
              row.startDate || '',
              row.nextPaymentDate || '',
              row.paymentMethod,
              row.enableNotification ? 'Yes' : 'No',
              row.notifyBefore,
              `"${(row.notes || '').replace(/"/g, '""')}"`,
              `"${(row.tags || '').replace(/"/g, '""')}"`,
              row.createdAt,
              row.updatedAt,
            ].join(','),
          ),
        ]

        const csvContent = csvRows.join('\n')
        const timestamp = new Date().toISOString().split('T')[0]

        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="wallie-subscriptions-${timestamp}.csv"`,
          },
        })
      }

      // JSON format (default)
      const timestamp = new Date().toISOString()

      return Response.json({
        exportedAt: timestamp,
        userId: req.user.id,
        userEmail: req.user.email,
        totalSubscriptions: exportData.length,
        subscriptions: exportData,
      })
    } catch (error) {
      console.error('Export error:', error)
      return Response.json({ error: 'Export failed' }, { status: 500 })
    }
  },
}
