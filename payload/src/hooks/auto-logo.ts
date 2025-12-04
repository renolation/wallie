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
 * Extract domain from URL
 */
function extractDomainFromUrl(url: string): string | null {
  try {
    // Handle URLs without protocol
    let urlToParse = url.trim()
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse
    }

    const parsed = new URL(urlToParse)
    // Remove www. prefix if present
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    // Try regex as fallback
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.[a-z.]{2,})/i)
    return match ? match[1] : null
  }
}

/**
 * Get domain from service name using known mappings
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

  return null
}

/**
 * Build logo URL using DuckDuckGo icons
 */
function buildLogoUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

/**
 * Auto-fetch logo hook for subscriptions
 * Priority:
 * 1. If logo already set (non-empty), keep it
 * 2. Try to get domain from user-entered websiteUrl field
 * 3. Try to get domain from service name mapping
 * 4. Fetch logo from DuckDuckGo icons
 */
export const autoLogoHook: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Only run on create or update
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  // Skip if logo is already set by user (non-empty string)
  if (data.logo && data.logo.trim() !== '') {
    return data
  }

  let domain: string | null = null

  // Priority 1: Try to extract domain from user-entered websiteUrl
  if (data.websiteUrl && data.websiteUrl.trim() !== '') {
    domain = extractDomainFromUrl(data.websiteUrl)
  }

  // Priority 2: Try to get domain from service name mapping
  if (!domain && data.name && data.name.trim() !== '') {
    domain = getDomainFromName(data.name)
  }

  // If no domain found, skip
  if (!domain) {
    return data
  }

  // Use DuckDuckGo icons - reliable and high quality
  data.logo = buildLogoUrl(domain)

  return data
}
