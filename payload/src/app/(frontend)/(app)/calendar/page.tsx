import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import CalendarClient from './client'

// Prevent static generation - this page needs runtime data
export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const payload = await getPayload({ config })

  // Get user from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your calendar</p>
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
        <p className="text-muted-foreground">Please log in to view your calendar</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your calendar</p>
      </div>
    )
  }

  // Fetch subscriptions using local API
  const subscriptions = await payload.find({
    collection: 'subscriptions',
    where: {
      owner: { equals: user.id },
    },
    depth: 1,
    limit: 1000,
  })

  // Fetch categories to get colors
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
  })

  // Build category color map
  const categoryColors: Record<string, string> = { Uncategorized: '#6B7280' }
  for (const cat of categories.docs) {
    if (cat.name && cat.color) {
      categoryColors[cat.name] = cat.color
    }
  }

  // Transform subscriptions for the calendar
  const calendarSubscriptions = subscriptions.docs.map((sub) => {
    const categoryName = typeof sub.category === 'object' ? sub.category?.name : 'Uncategorized'
    const catName = categoryName || 'Uncategorized'

    return {
      id: sub.id,
      name: sub.name,
      amount: sub.amount || 0,
      currency: sub.currency || 'USD',
      billingCycle: sub.billingCycle || 'monthly',
      nextBillingDate: sub.nextBillingDate || '',
      logoUrl: sub.logo || undefined,
      categoryName: catName,
      categoryColor: categoryColors[catName] || categoryColors.Uncategorized,
    }
  })

  const calendarData = {
    subscriptions: calendarSubscriptions,
    currency: user.currency || 'USD',
  }

  return <CalendarClient initialData={calendarData} />
}
