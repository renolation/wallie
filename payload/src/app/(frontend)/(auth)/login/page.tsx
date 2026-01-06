'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, Eye, EyeOff, LogIn, Infinity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import posthog from 'posthog-js'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || 'Invalid email or password')
      }

      // Capture login event in PostHog
      posthog.capture('user_logged_in', {
        method: 'email',
      })

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-[380px] flex flex-col gap-4 bg-card rounded-xl shadow-2xl border border-border p-6 sm:p-8 z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Infinity className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">SubMngr</h2>
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-black leading-tight tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-xs">Enter your credentials to access your account</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-9 pl-9 pr-3 text-sm bg-background border-border focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-9 pl-9 pr-9 text-sm bg-background border-border focus:border-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end -mt-1">
            <Link href="/forgot-password" className="text-primary hover:text-primary/80 text-xs font-medium transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="h-9 text-sm font-bold shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <LogIn className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border" />
          <span className="flex-shrink-0 mx-3 text-muted-foreground text-xs">OR</span>
          <div className="flex-grow border-t border-border" />
        </div>

        {/* Social Login */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-9 px-4 bg-transparent border border-border hover:bg-accent text-foreground text-sm font-medium transition-colors duration-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-1.5">
            <p className="text-muted-foreground text-xs">Don&apos;t have an account?</p>
            <Link href="/register" className="text-primary hover:text-primary/80 text-xs font-bold transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex gap-6 text-muted-foreground text-xs z-10">
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        <Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link>
      </div>
    </div>
  )
}
