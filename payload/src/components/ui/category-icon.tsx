import { icons, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Convert icon name from db (e.g., "music", "folder-open") to PascalCase (e.g., "Music", "FolderOpen")
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

interface CategoryIconProps {
  name?: string | null
  className?: string
  fallback?: keyof typeof icons
}

export function CategoryIcon({ name, className, fallback = 'FolderOpen' }: CategoryIconProps) {
  const iconName = name ? toPascalCase(name) : fallback
  const IconComponent = (icons[iconName as keyof typeof icons] || icons[fallback]) as LucideIcon

  return <IconComponent className={cn('w-4 h-4', className)} />
}
