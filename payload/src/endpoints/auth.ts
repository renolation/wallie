import type { Endpoint } from 'payload'

/**
 * Public Registration Endpoint
 * POST /api/auth/register
 *
 * Allows new users to register without authentication
 */
export const registerEndpoint: Endpoint = {
  path: '/auth/register',
  method: 'post',
  handler: async (req) => {
    try {
      const body = await req.json?.()

      if (!body?.email || !body?.password) {
        return Response.json(
          { error: 'Email and password are required' },
          { status: 400 },
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return Response.json(
          { error: 'Invalid email format' },
          { status: 400 },
        )
      }

      // Validate password length
      if (body.password.length < 8) {
        return Response.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 },
        )
      }

      // Check if user already exists
      const existingUser = await req.payload.find({
        collection: 'users',
        where: {
          email: { equals: body.email.toLowerCase() },
        },
        limit: 1,
      })

      if (existingUser.totalDocs > 0) {
        return Response.json(
          { error: 'Email already registered' },
          { status: 409 },
        )
      }

      // Create user
      const user = await req.payload.create({
        collection: 'users',
        data: {
          email: body.email.toLowerCase(),
          password: body.password,
          firstName: body.name || '',
          roles: ['user'], // Always create as regular user
        },
      })

      // Auto-login: generate token
      const loginResult = await req.payload.login({
        collection: 'users',
        data: {
          email: body.email.toLowerCase(),
          password: body.password,
        },
      })

      return Response.json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.firstName,
        },
        token: loginResult.token,
        exp: loginResult.exp,
      })
    } catch (error) {
      console.error('Registration error:', error)
      return Response.json(
        { error: 'Registration failed' },
        { status: 500 },
      )
    }
  },
}
