import React from 'react'
import './globals.css'

export const metadata = {
  description: 'Subscription Tracker',
  title: 'Substrack',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="m-0 p-0 bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
