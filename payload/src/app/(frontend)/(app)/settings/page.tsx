import { getPayload } from 'payload'
import { headers, cookies } from 'next/headers'
import config from '@payload-config'
import SettingsClient from './client'
import type { User, UserSetting, Plan, UserPlan } from '@/payload-types'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const cookieStore = await cookies()

  // Get auth token from cookies
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your settings</p>
      </div>
    )
  }

  // Get current user using the auth token
  let user: User | null = null
  let userSettings: UserSetting | null = null
  let currentUserPlan: UserPlan | null = null
  let allPlans: Plan[] = []

  try {
    // Verify the token and get user
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (authUser && authUser.id) {
      user = authUser as User

      // Get user settings
      const settingsResult = await payload.find({
        collection: 'user-settings',
        where: { user: { equals: user.id } },
        limit: 1,
        depth: 0,
      })

      if (settingsResult.docs.length > 0) {
        userSettings = settingsResult.docs[0]
      } else {
        // Create user settings if it doesn't exist
        userSettings = await payload.create({
          collection: 'user-settings',
          data: { user: user.id },
        })
      }

      // Get user's current plan
      const userPlanResult = await payload.find({
        collection: 'user-plans',
        where: {
          user: { equals: user.id },
          status: { in: ['active', 'trialing'] },
        },
        limit: 1,
        depth: 1, // Get plan details
        sort: '-createdAt',
      })

      if (userPlanResult.docs.length > 0) {
        currentUserPlan = userPlanResult.docs[0]
      }

      // Get all available plans
      const plansResult = await payload.find({
        collection: 'plans',
        where: { isActive: { equals: true } },
        sort: 'sortOrder',
        limit: 10,
      })
      allPlans = plansResult.docs
    }
  } catch (error) {
    console.error('Error fetching user settings:', error)
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Please log in to view your settings</p>
      </div>
    )
  }

  // Find the free plan as default
  const freePlan = allPlans.find((p) => p.slug === 'free')

  return (
    <SettingsClient
      initialUser={{
        id: String(user.id),
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      }}
      initialSettings={userSettings}
      currentPlan={currentUserPlan ? (currentUserPlan.plan as Plan) : freePlan || null}
      userPlan={currentUserPlan}
      allPlans={allPlans}
    />
  )
}
