'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, Eye, EyeOff, AppWindow, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-dark text-text-main font-display overflow-x-hidden justify-center items-center p-4">
      {/* Decoration / Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]"></div>
      </div>
      {/* Login Card */}
      <Card className="relative w-full max-w-[440px] flex flex-col gap-6 bg-surface rounded-2xl shadow-2xl border border-white/5 p-8 sm:p-10 z-10">
        {/* Header Section */}
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-text-main shadow-lg shadow-primary/20">
              <AppWindow className="text-2xl" />
            </div>
            <h2 className="text-text-main text-xl font-bold tracking-tight">SubTrack</h2>
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-text-main text-3xl font-black leading-tight tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-text-muted text-sm font-normal">Enter your credentials to access your account</CardDescription>
          </div>
        </CardHeader>
        {/* Form Section */}
        <CardContent>
          <form className="flex flex-col gap-5 mt-2" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <Label className="text-text-main text-sm font-medium leading-none" htmlFor="email">Email</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-text-muted">
                  <Mail size={20} />
                </span>
                <Input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-main focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-white/10 bg-background-dark focus:border-primary h-12 pl-10 pr-4 placeholder:text-text-muted/50 text-sm font-normal leading-normal transition-all duration-200"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label className="text-text-main text-sm font-medium leading-none" htmlFor="password">Password</Label>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-text-muted">
                  <Lock size={20} />
                </span>
                <Input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-main focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-white/10 bg-background-dark focus:border-primary h-12 pl-10 pr-10 placeholder:text-text-muted/50 text-sm font-normal leading-normal transition-all duration-200"
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button className="absolute right-3.5 flex items-center justify-center text-text-muted hover:text-text-main transition-colors" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
            </div>
            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link className="text-primary hover:text-primary-hover text-xs font-medium transition-colors" href="#">Forgot password?</Link>
            </div>
            {/* Submit Button */}
            <Button
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary hover:bg-primary-hover text-text-main text-sm font-bold leading-normal tracking-wide shadow-lg shadow-primary/20 transition-all duration-200 transform active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> :
                <>
                  <span className="truncate">Sign In</span>
                  <LogIn className="ml-2 text-lg" />
                </>
              }
            </Button>
          </form>
          {/* Footer Section */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-text-muted text-xs">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-4 bg-transparent border border-white/10 hover:bg-white/5 text-text-main text-sm font-medium transition-colors duration-200">
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M12.0003 20.45C16.667 20.45 20.5836 17.2833 20.5836 12.875C20.5836 12.375 20.5336 11.8333 20.4503 11.375H12.0003V14.3667H16.9253C16.8086 15.3417 16.142 16.8667 14.7336 17.7917L14.7176 17.915L17.3985 19.9531L17.5836 19.975C19.1753 18.5333 20.5836 16.275 20.5836 12.875H12.0003V20.45Z" fill="white" fillOpacity="1"></path>
                <path d="M12.0003 24.0001C14.4086 24.0001 16.4336 23.2084 17.9086 21.8501L14.7336 19.3917C13.9336 19.9334 12.917 20.2501 11.8253 20.2501C9.64198 20.2501 7.79198 18.7751 7.13365 16.7917L7.00898 16.8023L4.22095 18.9178L4.17531 18.9751C5.64198 21.8834 8.65031 24.0001 12.0003 24.0001Z" fill="white" fillOpacity="1"></path>
                <path d="M7.13349 16.7916C6.96682 16.2916 6.87516 15.7583 6.87516 15.2083C6.87516 14.6583 6.96682 14.1249 7.13349 13.6249L7.12704 13.4886L4.30595 11.3408L4.17516 11.4083C3.57516 12.6083 3.23349 13.9666 3.23349 15.4083C3.23349 16.8499 3.57516 18.2083 4.17516 19.4083L7.13349 16.7916Z" fill="white" fillOpacity="1"></path>
                <path d="M11.8253 10.1666C13.467 10.1666 14.567 10.875 15.192 11.4666L17.9836 8.74164C16.2836 7.15831 14.242 6.41664 11.8253 6.41664C8.47531 6.41664 5.46698 8.53331 4.00031 11.4416L6.95865 13.8416C7.61698 11.8583 9.46698 10.1666 11.8253 10.1666Z" fill="white" fillOpacity="1"></path>
              </svg>
              Continue with Google
            </Button>
            <div className="flex items-center gap-1.5">
              <p className="text-text-muted text-sm font-normal">Don't have an account?</p>
              <Link className="text-primary hover:text-primary-hover text-sm font-bold transition-colors" href="/register">Sign up</Link>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Subtle Footer Links */}
      <div className="mt-8 flex gap-6 text-text-muted text-xs">
        <Link className="hover:text-text-main transition-colors" href="#">Privacy Policy</Link>
        <Link className="hover:text-text-main transition-colors" href="#">Terms of Service</Link>
        <Link className="hover:text-text-main transition-colors" href="#">Help Center</Link>
      </div>
    </div>
  )
}
