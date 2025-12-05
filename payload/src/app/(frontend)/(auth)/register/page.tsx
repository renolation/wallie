'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Loader2, CheckCircle, ArrowRight, Github, AppWindow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      // Create user via Payload API
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || 'Registration failed')
      }

      // Auto login after registration
      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (loginRes.ok) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#222831] font-display text-[#EEEEEE] antialiased selection:bg-[#00ADB5] selection:text-white min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="w-full border-b border-[#393E46] bg-[#222831] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#00ADB5] flex items-center justify-center text-white">
                <AppWindow size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#EEEEEE]">SubTrack</span>
            </div>
            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-sm text-[#EEEEEE]/70">Already have an account?</span>
              <Link
                className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium transition-colors rounded bg-[#393E46] text-[#EEEEEE] hover:bg-[#393E46]/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00ADB5]"
                href="/login"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Page Heading & Intro */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-[#EEEEEE] sm:text-4xl">
              Create an Account
            </h1>
            <p className="text-[#EEEEEE]/60 text-base">
              Join us to track your subscriptions and manage recurring payments efficiently.
            </p>
          </div>
          {/* Registration Card */}
          <Card className="bg-[#393E46] py-8 px-6 shadow-xl rounded-xl sm:px-10 border border-[#EEEEEE]/5">
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name Field */}
                <div>
                  <Label className="block text-sm font-medium text-[#EEEEEE] mb-1.5" htmlFor="name">
                    Full Name
                  </Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="text-[#EEEEEE]/40" size={20} />
                    </div>
                    <Input
                      autoComplete="name"
                      className="block w-full rounded border-0 bg-[#222831] py-2.5 pl-10 pr-3 text-[#EEEEEE] placeholder:text-[#EEEEEE]/30 focus:ring-2 focus:ring-[#00ADB5] sm:text-sm sm:leading-6 transition-all"
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                {/* Email Address Field */}
                <div>
                  <Label className="block text-sm font-medium text-[#EEEEEE] mb-1.5" htmlFor="email">
                    Email Address
                  </Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="text-[#EEEEEE]/40" size={20} />
                    </div>
                    <Input
                      autoComplete="email"
                      className="block w-full rounded border-0 bg-[#222831] py-2.5 pl-10 pr-3 text-[#EEEEEE] placeholder:text-[#EEEEEE]/30 focus:ring-2 focus:ring-[#00ADB5] sm:text-sm sm:leading-6 transition-all"
                      id="email"
                      name="email"
                      placeholder="john@example.com"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                {/* Password Field */}
                <div>
                  <Label className="block text-sm font-medium text-[#EEEEEE] mb-1.5" htmlFor="password">
                    Password
                  </Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="text-[#EEEEEE]/40" size={20} />
                    </div>
                    <Input
                      className="block w-full rounded border-0 bg-[#222831] py-2.5 pl-10 pr-3 text-[#EEEEEE] placeholder:text-[#EEEEEE]/30 focus:ring-2 focus:ring-[#00ADB5] sm:text-sm sm:leading-6 transition-all"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                {/* Confirm Password Field */}
                <div>
                  <Label className="block text-sm font-medium text-[#EEEEEE] mb-1.5" htmlFor="confirm-password">
                    Confirm Password
                  </Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <CheckCircle className="text-[#EEEEEE]/40" size={20} />
                    </div>
                    <Input
                      className="block w-full rounded border-0 bg-[#222831] py-2.5 pl-10 pr-3 text-[#EEEEEE] placeholder:text-[#EEEEEE]/30 focus:ring-2 focus:ring-[#00ADB5] sm:text-sm sm:leading-6 transition-all"
                      id="confirm-password"
                      name="confirm-password"
                      placeholder="••••••••"
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                {/* Submit Button */}
                <div>
                  <Button
                    className="group relative flex w-full justify-center rounded bg-[#00ADB5] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#00ADB5]/90 hover:shadow-lg hover:shadow-[#00ADB5]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ADB5]"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" /> :
                      <>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <ArrowRight className="text-white/60 group-hover:text-white/90 transition-colors" size={20} />
                        </span>
                        Register
                      </>
                    }
                  </Button>
                </div>
              </form>
              {/* Divider */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EEEEEE]/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-[#393E46] px-2 text-[#EEEEEE]/50">Or continue with</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button className="flex w-full items-center justify-center gap-2 rounded bg-[#222831] px-3 py-2 text-sm font-medium text-[#EEEEEE] hover:bg-[#222831]/80 focus:outline-none focus:ring-1 focus:ring-[#00ADB5] transition-colors border border-[#EEEEEE]/5" type="button">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"></path>
                    </svg>
                    <span className="sr-only">Google</span>
                    Google
                  </Button>
                  <Button className="flex w-full items-center justify-center gap-2 rounded bg-[#222831] px-3 py-2 text-sm font-medium text-[#EEEEEE] hover:bg-[#222831]/80 focus:outline-none focus:ring-1 focus:ring-[#00ADB5] transition-colors border border-[#EEEEEE]/5" type="button">
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                    GitHub
                  </Button>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-xs text-[#EEEEEE]/40">
                  By registering, you agree to our
                  <Link className="font-medium text-[#00ADB5] hover:text-[#00ADB5]/80 underline transition-colors" href="#"> Terms of Service </Link>
                  and
                  <Link className="font-medium text-[#00ADB5] hover:text-[#00ADB5]/80 underline transition-colors" href="#"> Privacy Policy</Link>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
