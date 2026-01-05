import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import CategoriesClient from './client'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const payload = await getPayload({ config })

  // Get user from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your categories</p>
      </div>
    )
  }

  // Verify user
  let user
  try {
    const authResult = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
    user = authResult.user
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your categories</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your categories</p>
      </div>
    )
  }

  const [subscriptionsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'subscriptions',
      where: {
        owner: { equals: user.id },
      },
      depth: 1,
      limit: 1000,
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
