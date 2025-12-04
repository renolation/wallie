// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Subscriptions } from './collections/Subscriptions'
import { Households } from './collections/Households'
import { HouseholdMembers } from './collections/HouseholdMembers'
import { SplitAssignments } from './collections/SplitAssignments'
import { Notifications } from './collections/Notifications'
import { PriceRecords } from './collections/PriceRecords'

// Endpoints
import { dashboardSummaryEndpoint } from './endpoints/dashboard-summary'
import { runNotificationJobsEndpoint } from './endpoints/run-jobs'
import { seedCategoriesEndpoint } from './endpoints/seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- Wallie',
    },
  },
  collections: [
    // Core
    Users,
    Media,
    Categories,
    Subscriptions,
    // Households (Phase 2, but schema ready)
    Households,
    HouseholdMembers,
    SplitAssignments,
    // System
    Notifications,
    PriceRecords,
  ],
  endpoints: [
    // Dashboard
    dashboardSummaryEndpoint,
    // Jobs (for cron)
    runNotificationJobsEndpoint,
    // Seed data
    seedCategoriesEndpoint,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    // storage-adapter-placeholder
  ],
})
