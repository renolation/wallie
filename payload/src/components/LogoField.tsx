'use client'

import React, { useCallback, useState } from 'react'
import { useField, FieldLabel, useFormFields } from '@payloadcms/ui'

/**
 * Known service domains for common subscriptions
 */
const SERVICE_DOMAINS: Record<string, string> = {
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
  spotify: 'spotify.com',
  'apple music': 'music.apple.com',
  tidal: 'tidal.com',
  deezer: 'deezer.com',
  pandora: 'pandora.com',
  'youtube music': 'music.youtube.com',
  youtube: 'youtube.com',
  soundcloud: 'soundcloud.com',
  'xbox game pass': 'xbox.com',
  'playstation plus': 'playstation.com',
  'ps plus': 'playstation.com',
  'nintendo switch online': 'nintendo.com',
  'ea play': 'ea.com',
  'ubisoft+': 'ubisoft.com',
  steam: 'store.steampowered.com',
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
  dropbox: 'dropbox.com',
  'google drive': 'drive.google.com',
  'google one': 'one.google.com',
  icloud: 'icloud.com',
  onedrive: 'onedrive.com',
  'new york times': 'nytimes.com',
  nyt: 'nytimes.com',
  'washington post': 'washingtonpost.com',
  medium: 'medium.com',
  substack: 'substack.com',
  kindle: 'amazon.com',
  audible: 'audible.com',
  scribd: 'scribd.com',
  peloton: 'onepeloton.com',
  fitbit: 'fitbit.com',
  strava: 'strava.com',
  headspace: 'headspace.com',
  calm: 'calm.com',
  '1password': '1password.com',
  lastpass: 'lastpass.com',
  nordvpn: 'nordvpn.com',
  expressvpn: 'expressvpn.com',
  chatgpt: 'openai.com',
  openai: 'openai.com',
  claude: 'anthropic.com',
  grammarly: 'grammarly.com',
  linkedin: 'linkedin.com',
}

function getDomainFromName(name: string): string | null {
  const normalized = name.toLowerCase().trim()

  if (SERVICE_DOMAINS[normalized]) {
    return SERVICE_DOMAINS[normalized]
  }

  for (const [key, domain] of Object.entries(SERVICE_DOMAINS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return domain
    }
  }

  return null
}

function extractDomainFromUrl(url: string): string | null {
  try {
    let urlToParse = url.trim()
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse
    }
    const parsed = new URL(urlToParse)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.[a-z.]{2,})/i)
    return match ? match[1] : null
  }
}

// Build logo URL using DuckDuckGo icons
function buildLogoUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

interface LogoFieldProps {
  path: string
  field: {
    name: string
    label?: string
    admin?: {
      description?: string
    }
  }
}

export const LogoField: React.FC<LogoFieldProps> = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)

  // Get name and url fields from the form
  const nameField = useFormFields(([fields]) => fields['name'])
  const urlField = useFormFields(([fields]) => fields['url'])

  const fetchLogo = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPreviewError(false)

    try {
      let domain: string | null = null

      // Try URL field first
      const urlValue = urlField?.value as string
      if (urlValue && urlValue.trim()) {
        domain = extractDomainFromUrl(urlValue)
      }

      // Then try name field
      if (!domain) {
        const nameValue = nameField?.value as string
        if (nameValue && nameValue.trim()) {
          domain = getDomainFromName(nameValue)
        }
      }

      if (!domain) {
        setError('Could not determine domain. Enter a URL or use a known service name.')
        setLoading(false)
        return
      }

      // Use DuckDuckGo icons - reliable and high quality
      setValue(buildLogoUrl(domain))
    } catch (err) {
      console.error('Logo fetch error:', err)
      setError('Failed to fetch logo')
    } finally {
      setLoading(false)
    }
  }, [nameField?.value, urlField?.value, setValue])

  return (
    <div style={{ marginBottom: '24px' }}>
      <FieldLabel
        htmlFor={path}
        label={field.label || 'Logo URL'}
      />

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Logo Preview */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '8px',
            backgroundColor: '#2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid #3a3a3a',
          }}
        >
          {value && !previewError ? (
            <img
              src={value}
              alt="Logo preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={() => setPreviewError(true)}
            />
          ) : (
            <span style={{ color: '#666', fontSize: '12px' }}>No logo</span>
          )}
        </div>

        {/* Input and Button */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={value || ''}
                onChange={(e) => {
                  setValue(e.target.value)
                  setPreviewError(false)
                }}
                placeholder="https://logo.clearbit.com/example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>
            <button
              type="button"
              onClick={fetchLogo}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                whiteSpace: 'nowrap',
                fontSize: '14px',
              }}
            >
              {loading ? 'Fetching...' : 'Auto-fetch'}
            </button>
          </div>

          {field.admin?.description && (
            <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
              {field.admin.description}
            </p>
          )}

          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LogoField
