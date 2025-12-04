import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Known service domains for common subscriptions
 */
const SERVICE_DOMAINS: Record<string, string> = {
  // Streaming
  netflix: 'netflix.com',
  hulu: 'hulu.com',
  'disney+': 'disneyplus.com',
  'disney plus': 'disneyplus.com',
  'hbo max': 'hbomax.com',
  hbo: 'hbo.com',
  'amazon prime': 'amazon.com',
  'prime video': 'primevideo.com',
  peacock: 'peacocktv.com',
  paramount: 'paramountplus.com',
  'apple tv': 'tv.apple.com',
  crunchyroll: 'crunchyroll.com',

  // Music
  spotify: 'spotify.com',
  'apple music': 'music.apple.com',
  tidal: 'tidal.com',
  deezer: 'deezer.com',
  pandora: 'pandora.com',
  'youtube music': 'music.youtube.com',
  soundcloud: 'soundcloud.com',

  // Gaming
  'xbox game pass': 'xbox.com',
  'playstation plus': 'playstation.com',
  'ps plus': 'playstation.com',
  'nintendo switch online': 'nintendo.com',
  'ea play': 'ea.com',
  'ubisoft+': 'ubisoft.com',
  steam: 'store.steampowered.com',

  // Software
  adobe: 'adobe.com',
  'creative cloud': 'adobe.com',
  microsoft: 'microsoft.com',
  'office 365': 'office.com',
  notion: 'notion.so',
  slack: 'slack.com',
  zoom: 'zoom.us',
  canva: 'canva.com',
  figma: 'figma.com',
  github: 'github.com',
  jetbrains: 'jetbrains.com',

  // Cloud Storage
  dropbox: 'dropbox.com',
  'google drive': 'drive.google.com',
  'google one': 'one.google.com',
  icloud: 'icloud.com',
  onedrive: 'onedrive.com',

  // News & Reading
  'new york times': 'nytimes.com',
  nyt: 'nytimes.com',
  'washington post': 'washingtonpost.com',
  medium: 'medium.com',
  substack: 'substack.com',
  kindle: 'amazon.com',
  audible: 'audible.com',
  scribd: 'scribd.com',

  // Fitness
  peloton: 'onepeloton.com',
  fitbit: 'fitbit.com',
  strava: 'strava.com',
  headspace: 'headspace.com',
  calm: 'calm.com',

  // Security
  '1password': '1password.com',
  lastpass: 'lastpass.com',
  nordvpn: 'nordvpn.com',
  expressvpn: 'expressvpn.com',

  // Other
  chatgpt: 'openai.com',
  openai: 'openai.com',
  claude: 'anthropic.com',
  grammarly: 'grammarly.com',
  linkedin: 'linkedin.com',
}

/**
 * Get domain from service name
 */
function getDomainFromName(name: string): string | null {
  const normalized = name.toLowerCase().trim()

  // Check exact match first
  if (SERVICE_DOMAINS[normalized]) {
    return SERVICE_DOMAINS[normalized]
  }

  // Check partial match
  for (const [key, domain] of Object.entries(SERVICE_DOMAINS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return domain
    }
  }

  // Try to extract domain if name looks like a URL or domain
  const domainMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i)
  if (domainMatch) {
    return domainMatch[1]
  }

  return null
}

/**
 * Build logo URL using Clearbit Logo API (free, no API key needed)
 * Falls back to Google's favicon service
 */
function buildLogoUrl(domain: string): string {
  // Clearbit Logo API - returns high quality logos (128px)
  // Free tier: unlimited requests
  return `https://logo.clearbit.com/${domain}`
}

/**
 * Build fallback favicon URL using Google's service
 */
function buildFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

/**
 * Check if URL returns a valid image
 */
async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return response.ok && (contentType?.startsWith('image/') ?? false)
  } catch {
    return false
  }
}

/**
 * Auto-fetch logo hook for subscriptions
 */
export const autoLogoHook: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Only run on create or if name changed and no logo set
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  // Skip if logo is already uploaded or logoUrl is already set
  if (data.logo || data.logoUrl) {
    return data
  }

  // Skip if no name
  if (!data.name) {
    return data
  }

  const domain = getDomainFromName(data.name)
  if (!domain) {
    return data
  }

  // Try Clearbit first
  const clearbitUrl = buildLogoUrl(domain)
  if (await isValidImageUrl(clearbitUrl)) {
    data.logoUrl = clearbitUrl
    return data
  }

  // Fall back to Google Favicon
  const faviconUrl = buildFaviconUrl(domain)
  data.logoUrl = faviconUrl

  return data
}
