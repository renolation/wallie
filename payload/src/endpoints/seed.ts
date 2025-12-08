import type { Endpoint } from 'payload'

const DEFAULT_CATEGORIES = [
  { name: 'Entertainment', icon: 'tv', color: '#E50914' },
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

const POPULAR_SERVICES = [
  // Entertainment / Streaming
  { position: 1, name: 'Netflix', description: 'Movies and TV shows streaming service', logo: 'https://cdn.simpleicons.org/netflix/E50914', altText: 'Netflix', categoryName: 'Entertainment' },
  { position: 2, name: 'Disney+', description: 'Disney, Pixar, Marvel, Star Wars, and National Geographic', logo: 'https://www.google.com/s2/favicons?domain=disneyplus.com&sz=256', altText: 'Disney+', categoryName: 'Entertainment' },
  { position: 3, name: 'Hulu', description: 'TV shows and movies streaming', logo: 'https://www.google.com/s2/favicons?domain=hulu.com&sz=256', altText: 'Hulu', categoryName: 'Entertainment' },
  { position: 4, name: 'Amazon Prime Video', description: "Amazon's streaming service", logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=256', altText: 'Amazon Prime Video', categoryName: 'Entertainment' },
  { position: 5, name: 'Max (HBO Max)', description: 'HBO, Max Originals, and Warner Bros content', logo: 'https://www.google.com/s2/favicons?domain=max.com&sz=128', altText: 'Max (HBO Max)', categoryName: 'Entertainment' },
  { position: 6, name: 'Paramount+', description: 'Paramount streaming service', logo: 'https://www.google.com/s2/favicons?domain=paramountplus.com&sz=128', altText: 'Paramount+', categoryName: 'Entertainment' },
  { position: 7, name: 'Peacock', description: 'NBCUniversal streaming service', logo: 'https://www.google.com/s2/favicons?domain=peacocktv.com&sz=128', altText: 'Peacock', categoryName: 'Entertainment' },
  { position: 8, name: 'Apple TV+', description: "Apple's original content streaming", logo: 'https://www.google.com/s2/favicons?domain=tv.apple.com&sz=128', altText: 'Apple TV+', categoryName: 'Entertainment' },
  { position: 9, name: 'YouTube Premium', description: 'Ad-free YouTube with background play', logo: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128', altText: 'YouTube Premium', categoryName: 'Entertainment' },
  { position: 10, name: 'Crunchyroll', description: 'Anime streaming service', logo: 'https://www.google.com/s2/favicons?domain=crunchyroll.com&sz=128', altText: 'Crunchyroll', categoryName: 'Entertainment' },
  // Music
  { position: 11, name: 'Spotify', description: 'Music streaming service', logo: 'https://cdn.simpleicons.org/spotify/1DB954', altText: 'Spotify', categoryName: 'Music' },
  { position: 12, name: 'Apple Music', description: "Apple's music streaming service", logo: 'https://cdn.simpleicons.org/applemusic/FA243C', altText: 'Apple Music', categoryName: 'Music' },
  { position: 13, name: 'Amazon Music Unlimited', description: "Amazon's music streaming service", logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128', altText: 'Amazon Music Unlimited', categoryName: 'Music' },
  { position: 14, name: 'YouTube Music', description: "YouTube's music streaming service", logo: 'https://www.google.com/s2/favicons?domain=music.youtube.com&sz=128', altText: 'YouTube Music', categoryName: 'Music' },
  { position: 15, name: 'Tidal', description: 'High-fidelity music streaming', logo: 'https://www.google.com/s2/favicons?domain=tidal.com&sz=128', altText: 'Tidal', categoryName: 'Music' },
  { position: 16, name: 'SoundCloud Go+', description: 'Independent music streaming', logo: 'https://www.google.com/s2/favicons?domain=soundcloud.com&sz=128', altText: 'SoundCloud Go+', categoryName: 'Music' },
  // Productivity
  { position: 17, name: 'Microsoft 365', description: 'Office apps and cloud services', logo: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128', altText: 'Microsoft 365', categoryName: 'Productivity' },
  { position: 18, name: 'Google Workspace', description: 'Gmail, Drive, Docs, and more', logo: 'https://www.google.com/s2/favicons?domain=workspace.google.com&sz=128', altText: 'Google Workspace', categoryName: 'Productivity' },
  { position: 19, name: 'Notion', description: 'All-in-one workspace', logo: 'https://www.google.com/s2/favicons?domain=notion.so&sz=128', altText: 'Notion', categoryName: 'Productivity' },
  { position: 20, name: 'Evernote', description: 'Note-taking app', logo: 'https://www.google.com/s2/favicons?domain=evernote.com&sz=128', altText: 'Evernote', categoryName: 'Productivity' },
  { position: 21, name: 'Todoist', description: 'Task management app', logo: 'https://www.google.com/s2/favicons?domain=todoist.com&sz=128', altText: 'Todoist', categoryName: 'Productivity' },
  { position: 22, name: 'Trello', description: 'Project management boards', logo: 'https://www.google.com/s2/favicons?domain=trello.com&sz=128', altText: 'Trello', categoryName: 'Productivity' },
  { position: 23, name: 'Asana', description: 'Team collaboration and project management', logo: 'https://www.google.com/s2/favicons?domain=asana.com&sz=128', altText: 'Asana', categoryName: 'Productivity' },
  { position: 24, name: 'Monday.com', description: 'Work operating system', logo: 'https://www.google.com/s2/favicons?domain=monday.com&sz=128', altText: 'Monday.com', categoryName: 'Productivity' },
  { position: 25, name: 'Slack', description: 'Team communication platform', logo: 'https://www.google.com/s2/favicons?domain=slack.com&sz=128', altText: 'Slack', categoryName: 'Communication' },
  { position: 26, name: 'Grammarly', description: 'Writing assistant', logo: 'https://www.google.com/s2/favicons?domain=grammarly.com&sz=128', altText: 'Grammarly', categoryName: 'Productivity' },
  // Software / Design
  { position: 27, name: 'Adobe Creative Cloud', description: "Adobe's suite of creative apps", logo: 'https://www.google.com/s2/favicons?domain=adobe.com&sz=128', altText: 'Adobe Creative Cloud', categoryName: 'Software' },
  { position: 28, name: 'Canva Pro', description: 'Graphic design platform', logo: 'https://www.google.com/s2/favicons?domain=canva.com&sz=128', altText: 'Canva Pro', categoryName: 'Software' },
  { position: 29, name: 'Figma', description: 'Collaborative design tool', logo: 'https://www.google.com/s2/favicons?domain=figma.com&sz=128', altText: 'Figma', categoryName: 'Software' },
  { position: 30, name: 'Sketch', description: 'Digital design toolkit', logo: 'https://www.google.com/s2/favicons?domain=sketch.com&sz=128', altText: 'Sketch', categoryName: 'Software' },
  // Cloud Storage
  { position: 31, name: 'Dropbox', description: 'Cloud file storage and sharing', logo: 'https://www.google.com/s2/favicons?domain=dropbox.com&sz=128', altText: 'Dropbox', categoryName: 'Cloud Storage' },
  { position: 32, name: 'Google One', description: 'Google Drive storage plans', logo: 'https://www.google.com/s2/favicons?domain=one.google.com&sz=128', altText: 'Google One', categoryName: 'Cloud Storage' },
  { position: 33, name: 'iCloud+', description: 'Apple cloud storage', logo: 'https://www.google.com/s2/favicons?domain=icloud.com&sz=128', altText: 'iCloud+', categoryName: 'Cloud Storage' },
  { position: 34, name: 'OneDrive', description: 'Microsoft cloud storage', logo: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128', altText: 'OneDrive', categoryName: 'Cloud Storage' },
  // Gaming
  { position: 35, name: 'PlayStation Plus', description: 'PlayStation online gaming and games', logo: 'https://www.google.com/s2/favicons?domain=playstation.com&sz=128', altText: 'PlayStation Plus', categoryName: 'Gaming' },
  { position: 36, name: 'Xbox Game Pass', description: 'Xbox games subscription', logo: 'https://www.google.com/s2/favicons?domain=xbox.com&sz=128', altText: 'Xbox Game Pass', categoryName: 'Gaming' },
  { position: 37, name: 'Nintendo Switch Online', description: 'Nintendo online gaming', logo: 'https://www.google.com/s2/favicons?domain=nintendo.com&sz=128', altText: 'Nintendo Switch Online', categoryName: 'Gaming' },
  { position: 38, name: 'EA Play', description: 'EA games subscription', logo: 'https://www.google.com/s2/favicons?domain=ea.com&sz=128', altText: 'EA Play', categoryName: 'Gaming' },
  // Health & Fitness
  { position: 39, name: 'Peloton', description: 'Fitness classes and workouts', logo: 'https://www.google.com/s2/favicons?domain=onepeloton.com&sz=128', altText: 'Peloton', categoryName: 'Health & Fitness' },
  { position: 40, name: 'Apple Fitness+', description: "Apple's fitness service", logo: 'https://www.google.com/s2/favicons?domain=fitness.apple.com&sz=128', altText: 'Apple Fitness+', categoryName: 'Health & Fitness' },
  { position: 41, name: 'Strava', description: 'Fitness tracking and social network', logo: 'https://www.google.com/s2/favicons?domain=strava.com&sz=128', altText: 'Strava', categoryName: 'Health & Fitness' },
  { position: 42, name: 'MyFitnessPal', description: 'Calorie counter and diet tracker', logo: 'https://www.google.com/s2/favicons?domain=myfitnesspal.com&sz=128', altText: 'MyFitnessPal', categoryName: 'Health & Fitness' },
  // Security
  { position: 43, name: 'NordVPN', description: 'VPN service', logo: 'https://www.google.com/s2/favicons?domain=nordvpn.com&sz=128', altText: 'NordVPN', categoryName: 'Security' },
  { position: 44, name: 'ExpressVPN', description: 'VPN service', logo: 'https://www.google.com/s2/favicons?domain=expressvpn.com&sz=128', altText: 'ExpressVPN', categoryName: 'Security' },
  { position: 45, name: '1Password', description: 'Password manager', logo: 'https://www.google.com/s2/favicons?domain=1password.com&sz=128', altText: '1Password', categoryName: 'Security' },
  { position: 46, name: 'LastPass', description: 'Password manager', logo: 'https://www.google.com/s2/favicons?domain=lastpass.com&sz=128', altText: 'LastPass', categoryName: 'Security' },
  { position: 47, name: 'Bitwarden', description: 'Open-source password manager', logo: 'https://www.google.com/s2/favicons?domain=bitwarden.com&sz=128', altText: 'Bitwarden', categoryName: 'Security' },
  // News & Reading
  { position: 48, name: 'The New York Times', description: 'Digital news subscription', logo: 'https://www.google.com/s2/favicons?domain=nytimes.com&sz=128', altText: 'The New York Times', categoryName: 'News & Reading' },
  { position: 49, name: 'The Wall Street Journal', description: 'Business news subscription', logo: 'https://www.google.com/s2/favicons?domain=wsj.com&sz=128', altText: 'The Wall Street Journal', categoryName: 'News & Reading' },
  { position: 50, name: 'Medium', description: 'Online publishing platform', logo: 'https://www.google.com/s2/favicons?domain=medium.com&sz=128', altText: 'Medium', categoryName: 'News & Reading' },
  { position: 51, name: 'Substack', description: 'Newsletter platform', logo: 'https://www.google.com/s2/favicons?domain=substack.com&sz=128', altText: 'Substack', categoryName: 'News & Reading' },
  { position: 52, name: 'Audible', description: 'Audiobook subscription', logo: 'https://www.google.com/s2/favicons?domain=audible.com&sz=128', altText: 'Audible', categoryName: 'News & Reading' },
  { position: 53, name: 'Kindle Unlimited', description: 'Ebook subscription', logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128', altText: 'Kindle Unlimited', categoryName: 'News & Reading' },
  // Other (Dating)
  { position: 54, name: 'Tinder', description: 'Dating app', logo: 'https://www.google.com/s2/favicons?domain=tinder.com&sz=128', altText: 'Tinder', categoryName: 'Other' },
  { position: 55, name: 'Bumble', description: 'Dating app', logo: 'https://www.google.com/s2/favicons?domain=bumble.com&sz=128', altText: 'Bumble', categoryName: 'Other' },
  { position: 56, name: 'Hinge', description: 'Dating app', logo: 'https://www.google.com/s2/favicons?domain=hinge.co&sz=128', altText: 'Hinge', categoryName: 'Other' },
  // Shopping / Food Delivery
  { position: 57, name: 'HelloFresh', description: 'Meal kit delivery', logo: 'https://www.google.com/s2/favicons?domain=hellofresh.com&sz=128', altText: 'HelloFresh', categoryName: 'Shopping' },
  { position: 58, name: 'Blue Apron', description: 'Meal kit delivery', logo: 'https://www.google.com/s2/favicons?domain=blueapron.com&sz=128', altText: 'Blue Apron', categoryName: 'Shopping' },
  { position: 59, name: 'DoorDash DashPass', description: 'Food delivery subscription', logo: 'https://www.google.com/s2/favicons?domain=doordash.com&sz=128', altText: 'DoorDash DashPass', categoryName: 'Shopping' },
  { position: 60, name: 'Uber One', description: 'Uber and Uber Eats subscription', logo: 'https://www.google.com/s2/favicons?domain=uber.com&sz=128', altText: 'Uber One', categoryName: 'Shopping' },
  // Software / Developer Tools
  { position: 61, name: 'GitHub Pro', description: 'Code hosting and collaboration', logo: 'https://www.google.com/s2/favicons?domain=github.com&sz=128', altText: 'GitHub Pro', categoryName: 'Software' },
  { position: 62, name: 'Vercel Pro', description: 'Frontend deployment platform', logo: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=128', altText: 'Vercel Pro', categoryName: 'Software' },
  { position: 63, name: 'Heroku', description: 'Cloud platform as a service', logo: 'https://www.google.com/s2/favicons?domain=heroku.com&sz=128', altText: 'Heroku', categoryName: 'Software' },
  { position: 64, name: 'AWS', description: 'Amazon cloud services', logo: 'https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=128', altText: 'AWS', categoryName: 'Software' },
  { position: 65, name: 'DigitalOcean', description: 'Cloud infrastructure', logo: 'https://www.google.com/s2/favicons?domain=digitalocean.com&sz=128', altText: 'DigitalOcean', categoryName: 'Software' },
  { position: 66, name: 'Linear', description: 'Issue tracking for software teams', logo: 'https://www.google.com/s2/favicons?domain=linear.app&sz=128', altText: 'Linear', categoryName: 'Software' },
  { position: 67, name: 'JetBrains', description: 'IDE and developer tools', logo: 'https://www.google.com/s2/favicons?domain=jetbrains.com&sz=128', altText: 'JetBrains', categoryName: 'Software' },
  // Education
  { position: 68, name: 'Duolingo Plus', description: 'Language learning app', logo: 'https://www.google.com/s2/favicons?domain=duolingo.com&sz=128', altText: 'Duolingo Plus', categoryName: 'Education' },
  { position: 69, name: 'Coursera Plus', description: 'Online courses and certifications', logo: 'https://www.google.com/s2/favicons?domain=coursera.org&sz=128', altText: 'Coursera Plus', categoryName: 'Education' },
  { position: 70, name: 'Udemy', description: 'Online learning platform', logo: 'https://www.google.com/s2/favicons?domain=udemy.com&sz=128', altText: 'Udemy', categoryName: 'Education' },
  { position: 71, name: 'Skillshare', description: 'Creative learning platform', logo: 'https://www.google.com/s2/favicons?domain=skillshare.com&sz=128', altText: 'Skillshare', categoryName: 'Education' },
  { position: 72, name: 'LinkedIn Learning', description: 'Professional development courses', logo: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=128', altText: 'LinkedIn Learning', categoryName: 'Education' },
  // Communication
  { position: 73, name: 'Zoom', description: 'Video conferencing', logo: 'https://www.google.com/s2/favicons?domain=zoom.us&sz=128', altText: 'Zoom', categoryName: 'Communication' },
  { position: 74, name: 'Discord Nitro', description: 'Enhanced Discord features', logo: 'https://www.google.com/s2/favicons?domain=discord.com&sz=128', altText: 'Discord Nitro', categoryName: 'Communication' },
  { position: 75, name: 'WhatsApp Business', description: 'Business messaging platform', logo: 'https://www.google.com/s2/favicons?domain=whatsapp.com&sz=128', altText: 'WhatsApp Business', categoryName: 'Communication' },
  // Finance
  { position: 76, name: 'QuickBooks', description: 'Accounting software', logo: 'https://www.google.com/s2/favicons?domain=quickbooks.intuit.com&sz=128', altText: 'QuickBooks', categoryName: 'Finance' },
  { position: 77, name: 'Mint', description: 'Personal finance management', logo: 'https://www.google.com/s2/favicons?domain=mint.intuit.com&sz=128', altText: 'Mint', categoryName: 'Finance' },
  { position: 78, name: 'YNAB (You Need A Budget)', description: 'Budgeting software', logo: 'https://www.google.com/s2/favicons?domain=ynab.com&sz=128', altText: 'YNAB (You Need A Budget)', categoryName: 'Finance' },
]

/**
 * Seed Popular Services Endpoint
 * POST /api/seed/popular-services
 *
 * Seeds popular services. Only accessible by admin users.
 */
export const seedPopularServicesEndpoint: Endpoint = {
  path: '/seed/popular-services',
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

      // Build a cache of category name -> id
      const categoriesResult = await req.payload.find({
        collection: 'categories',
        limit: 100,
      })
      const categoryMap = new Map<string, number>()
      for (const cat of categoriesResult.docs) {
        categoryMap.set(cat.name, cat.id)
      }

      for (const service of POPULAR_SERVICES) {
        // Check if service already exists
        const existing = await req.payload.find({
          collection: 'popular-services',
          where: {
            name: { equals: service.name },
          },
          limit: 1,
        })

        if (existing.totalDocs > 0) {
          results.skipped.push(service.name)
          continue
        }

        try {
          // Look up category ID from name
          const categoryId = service.categoryName ? categoryMap.get(service.categoryName) : undefined

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { categoryName, ...serviceData } = service

          await req.payload.create({
            collection: 'popular-services',
            data: {
              ...serviceData,
              defaultCategory: categoryId,
            },
          })
          results.created.push(service.name)
        } catch (err) {
          results.errors.push(`${service.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
