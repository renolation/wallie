'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, Users, FolderOpen, Calendar, Settings, LogOut, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: number
  email: string
  name?: string
  role: string
}

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Subscriptions',
    href: '/subscriptions',
    icon: CreditCard,
  },
  {
    label: 'Family',
    href: '/family',
    icon: Users,
  },
  {
    label: 'Categories',
    href: '/categories',
    icon: FolderOpen,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
      window.location.href = '/admin'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <aside className="w-64 h-screen bg-card text-foreground flex flex-col fixed left-0 top-0 border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-xl font-bold text-primary-foreground">
          W
        </div>
        <span className="text-xl font-bold">Wallie</span>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                isActive && 'bg-primary/20 text-primary'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Section */}
      <div className="p-4 border-t border-border">
        {user && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-semibold truncate">{user.name || 'User'}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>

            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-2 bg-secondary/20 text-secondary rounded-lg text-sm hover:bg-secondary/30 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
