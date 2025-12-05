import { getPayload } from 'payload'
import config from '@payload-config'
import CategoriesClient from './client'

export default async function CategoriesPage() {
  const payload = await getPayload({ config })

  const [subscriptionsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'subscriptions',
      depth: 1,
      limit: 100,
    }),
    payload.find({
      collection: 'categories',
      depth: 1,
      limit: 100,
    }),
  ])

  return (
    <CategoriesClient
      initialSubscriptions={subscriptionsResult.docs}
      initialCategories={categoriesResult.docs}
    />
  )
}
