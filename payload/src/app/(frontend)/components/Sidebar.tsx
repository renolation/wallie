'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, CreditCard, FolderOpen, Calendar, Settings, LogOut, HelpCircle, X, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '../hooks/useAuth'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { label: 'Categories', href: '/categories', icon: FolderOpen },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user?.firstName) return user.firstName
    return 'User'
  }

  const getUserInitial = () => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'h-screen bg-background flex flex-col fixed left-0 top-0 border-r border-border z-50 transition-all duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'lg:w-16' : 'w-64'
        )}
      >
        {/* Logo & Brand */}
        <div className={cn(
          'flex items-center py-5 transition-all duration-300',
          collapsed ? 'justify-center px-2' : 'justify-between px-5'
        )}>
          <div className={cn('flex items-center', collapsed ? 'gap-0' : 'gap-3')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            {!collapsed && <span className="text-lg font-bold text-foreground">Substrack</span>}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-card transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Info */}
        {user && (
          <div className={cn(
            'flex items-center py-3 transition-all duration-300',
            collapsed ? 'justify-center px-2' : 'gap-3 px-5'
          )}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {getUserInitial()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className={cn('flex-1 py-4 transition-all duration-300', collapsed ? 'px-2' : 'px-3')}>
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-card'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className={cn('pb-4 space-y-1 transition-all duration-300', collapsed ? 'px-2' : 'px-3')}>
          {/* Collapse Toggle - Desktop Only */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'hidden lg:flex items-center w-full rounded-lg text-sm font-medium text-foreground hover:bg-card transition-colors cursor-pointer',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              )}
            >
              {collapsed ? (
                <PanelLeft className="w-4 h-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/help"
            onClick={handleNavClick}
            title={collapsed ? 'Help Center' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm font-medium text-foreground hover:bg-card transition-colors',
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
            )}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Help Center</span>}
          </Link>
          <button
            onClick={() => {
              handleNavClick()
              logout()
            }}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'flex items-center w-full rounded-lg text-sm font-medium text-foreground hover:bg-card transition-colors cursor-pointer',
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
