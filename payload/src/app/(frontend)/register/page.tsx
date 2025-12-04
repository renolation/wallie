'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // Redirect to admin panel after successful registration
      router.push('/admin')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Sign up for Wallie</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="name">
              Name
            </label>
            <input
              style={styles.input}
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email *
            </label>
            <input
              style={styles.input}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">
              Password *
            </label>
            <input
              style={styles.input}
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="confirmPassword">
              Confirm Password *
            </label>
            <input
              style={styles.input}
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <a href="/admin" style={styles.link}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f0f',
    padding: '20px',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  title: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#888888',
    fontSize: '14px',
    marginBottom: '32px',
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#ff4d4d20',
    border: '1px solid #ff4d4d',
    borderRadius: '4px',
    color: '#ff4d4d',
    padding: '12px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#cccccc',
    fontSize: '14px',
    fontWeight: 500,
  },
  input: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '14px',
    padding: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    color: '#0f0f0f',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    padding: '14px',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  footer: {
    color: '#888888',
    fontSize: '14px',
    marginTop: '24px',
    textAlign: 'center',
  },
  link: {
    color: '#ffffff',
    textDecoration: 'none',
  },
}
