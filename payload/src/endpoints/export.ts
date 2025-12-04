import type { Endpoint } from 'payload'

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
        description: sub.description || '',
        price: sub.price,
        priceFormatted: `${(sub.price / 100).toFixed(2)}`,
        currency: sub.currency || 'USD',
        billingCycle: sub.billingCycle,
        status: sub.status,
        category: typeof sub.category === 'object' ? sub.category?.name : '',
        firstPaymentDate: sub.firstPaymentDate,
        nextPaymentDate: sub.nextPaymentDate,
        website: sub.website || '',
        notes: sub.notes || '',
        autoRenew: sub.autoRenew,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      }))

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'ID',
          'Name',
          'Description',
          'Price (cents)',
          'Price',
          'Currency',
          'Billing Cycle',
          'Status',
          'Category',
          'First Payment Date',
          'Next Payment Date',
          'Website',
          'Notes',
          'Auto Renew',
          'Created At',
          'Updated At',
        ]

        const csvRows = [
          headers.join(','),
          ...exportData.map((row) =>
            [
              row.id,
              `"${(row.name || '').replace(/"/g, '""')}"`,
              `"${(row.description || '').replace(/"/g, '""')}"`,
              row.price,
              row.priceFormatted,
              row.currency,
              row.billingCycle,
              row.status,
              `"${(row.category || '').replace(/"/g, '""')}"`,
              row.firstPaymentDate || '',
              row.nextPaymentDate || '',
              `"${(row.website || '').replace(/"/g, '""')}"`,
              `"${(row.notes || '').replace(/"/g, '""')}"`,
              row.autoRenew ? 'Yes' : 'No',
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
