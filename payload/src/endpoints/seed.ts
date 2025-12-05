import type { Endpoint } from 'payload'

const DEFAULT_CATEGORIES = [
  { name: 'Music', icon: 'music', color: '#1DB954' },
  { name: 'Gaming', icon: 'gamepad', color: '#9147FF' },
  { name: 'Software', icon: 'code', color: '#0078D4' },
  { name: 'Cloud Storage', icon: 'cloud', color: '#4285F4' },
  { name: 'News & Reading', icon: 'newspaper', color: '#1A1A1A' },
  { name: 'Productivity', icon: 'briefcase', color: '#FF6B00' },
  { name: 'Health & Fitness', icon: 'heart', color: '#FF2D55' },
  { name: 'Education', icon: 'book', color: '#00A67E' },
  { name: 'Utilities', icon: 'settings', color: '#6B7280' },
  { name: 'Shopping', icon: 'shopping-cart', color: '#FF9900' },
  { name: 'Finance', icon: 'dollar-sign', color: '#00C805' },
  { name: 'Communication', icon: 'message-circle', color: '#25D366' },
  { name: 'Security', icon: 'shield', color: '#1E3A8A' },
  { name: 'Other', icon: 'box', color: '#9CA3AF' },
]

/**
 * Seed Endpoint
 * POST /api/seed/categories
 *
 * Seeds default categories. Only accessible by admin users.
 */
export const seedCategoriesEndpoint: Endpoint = {
  path: '/seed/categories',
  method: 'post',
  handler: async (req) => {
    if (!req.user || !req.user.roles?.includes('admin')) {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    try {
      const results = {
        created: [] as string[],
        skipped: [] as string[],
        errors: [] as string[],
      }

      for (const category of DEFAULT_CATEGORIES) {
        // Check if category already exists
        const existing = await req.payload.find({
          collection: 'categories',
          where: {
            name: { equals: category.name },
          },
          limit: 1,
        })

        if (existing.totalDocs > 0) {
          results.skipped.push(category.name)
          continue
        }

        try {
          await req.payload.create({
            collection: 'categories',
            data: {
              ...category,
              isPublic: true,
            },
          })
          results.created.push(category.name)
        } catch (err) {
          results.errors.push(`${category.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }

      return Response.json({
        success: true,
        results,
        summary: {
          created: results.created.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
        },
      })
    } catch (error) {
      console.error('Seed error:', error)
      return Response.json(
        {
          error: 'Seed failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      )
    }
  },
}
