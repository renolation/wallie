'use client'

import React from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { ToastProvider } from '@/components/ui/toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth(true)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="ml-64 flex-1 h-screen overflow-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
