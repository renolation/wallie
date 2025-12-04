import React from 'react'
import './globals.css'
import Sidebar from './components/Sidebar'

export const metadata = {
  description: 'Subscription Tracker',
  title: 'Wallie',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className="dark">
      <body className="m-0 p-0">
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="ml-64 flex-1 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
