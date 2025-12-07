import { getPayload } from 'payload'
import { headers, cookies } from 'next/headers'
import config from '@payload-config'
import SettingsClient from './client'
import type { User, UserSetting } from '@/payload-types'

export default async function SettingsPage() {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const cookieStore = await cookies()

  // Get auth token from cookies
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    return null // Layout will handle redirect
  }

  // Get current user using the auth token
  let user: User | null = null
  let userSettings: UserSetting | null = null

  try {
    // Verify the token and get user
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (authUser) {
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
    }
  } catch (error) {
    console.error('Error fetching user settings:', error)
  }

  if (!user) {
    return null // Layout will handle redirect
  }

  return (
    <SettingsClient
      initialUser={{
        id: String(user.id),
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      }}
      initialSettings={userSettings}
    />
  )
}
