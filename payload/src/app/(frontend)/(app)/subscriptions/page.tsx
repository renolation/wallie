import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import SubscriptionsClient from './client'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  const payload = await getPayload({ config })

  // Get user from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your subscriptions</p>
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
        <p className="text-muted-foreground">Please log in to view your subscriptions</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your subscriptions</p>
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

  // Transform subscriptions for the client
  const clientSubscriptions = subscriptions.docs.map((sub) => {
    const categoryName = typeof sub.category === 'object' ? sub.category?.name : 'Uncategorized'
    const catName = categoryName || 'Uncategorized'
    const categoryId = typeof sub.category === 'object' ? sub.category?.id : sub.category

    return {
      id: sub.id,
      name: sub.name,
      logo: sub.logo || undefined,
      amount: sub.amount || 0,
      currency: sub.currency || 'USD',
      frequency: sub.frequency || 1,
      billingCycle: sub.billingCycle || 'monthly',
      nextBillingDate: sub.nextBillingDate || undefined,
      autoRenew: sub.autoRenew ?? true,
      categoryName: catName,
      categoryColor: categoryColors[catName] || categoryColors.Uncategorized,
      // Additional fields for edit/duplicate
      websiteUrl: sub.websiteUrl || undefined,
      description: sub.description || undefined,
      promoPrice: sub.promoPrice || undefined,
      promoEndDate: sub.promoEndDate || undefined,
      startDate: sub.startDate || undefined,
      freeTrialEndDate: sub.freeTrialEndDate || undefined,
      category: categoryId,
      notes: sub.notes || undefined,
      tags: sub.tags || undefined,
      household: typeof sub.household === 'object' ? sub.household?.id : sub.household,
    }
  })

  return <SubscriptionsClient initialSubscriptions={clientSubscriptions} />
}
