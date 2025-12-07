import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

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

async function seedCategories() {
  console.log('Starting category seed...')

  const payload = await getPayload({ config })

  const results = {
    created: [] as string[],
    skipped: [] as string[],
    errors: [] as string[],
  }

  for (const category of DEFAULT_CATEGORIES) {
    // Check if category already exists
    const existing = await payload.find({
      collection: 'categories',
      where: {
        name: { equals: category.name },
      },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      results.skipped.push(category.name)
      console.log(`⏭️  Skipped: ${category.name} (already exists)`)
      continue
    }

    try {
      await payload.create({
        collection: 'categories',
        data: {
          ...category,
          isPublic: true,
        },
      })
      results.created.push(category.name)
      console.log(`✅ Created: ${category.name}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      results.errors.push(`${category.name}: ${errorMsg}`)
      console.log(`❌ Error: ${category.name} - ${errorMsg}`)
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Created: ${results.created.length}`)
  console.log(`Skipped: ${results.skipped.length}`)
  console.log(`Errors: ${results.errors.length}`)

  process.exit(0)
}

seedCategories().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
