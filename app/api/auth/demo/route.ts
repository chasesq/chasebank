/**
 * Demo/Test Authentication Endpoint
 * Provides test credentials and demo account creation
 * ONLY for development - remove in production
 */

import { NextRequest, NextResponse } from 'next/server'
import { TEST_USERS, validateTestUserCredentials, getTestCredentialsMarkdown } from '@/lib/auth/test-credentials'

/**
 * GET /api/auth/demo - Get list of test credentials
 * This is for documentation/development only
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test credentials not available in production' },
      { status: 403 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format')

  if (format === 'markdown') {
    return new NextResponse(getTestCredentialsMarkdown(), {
      headers: { 'Content-Type': 'text/markdown' },
    })
  }

  return NextResponse.json({
    message: 'Chase Bank Test Credentials',
    description: 'These credentials are for development and testing only',
    testUsers: TEST_USERS.map((user) => ({
      email: user.email,
      password: user.password,
      username: user.username,
      accountType: user.accountType,
      description: user.description,
    })),
    note: 'POST to /api/auth/demo/login to validate credentials',
  })
}

/**
 * POST /api/auth/demo/login - Validate test user credentials
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Demo authentication not available in production' },
      { status: 403 }
    )
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate against test users
    const testUser = validateTestUserCredentials(email, password)

    if (!testUser) {
      return NextResponse.json(
        { error: 'Invalid test credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test credentials validated',
      user: {
        email: testUser.email,
        username: testUser.username,
        phone: testUser.phone,
        accountNumber: testUser.accountNumber,
        accountType: testUser.accountType,
      },
      nextStep: testUser.accountType === '2fa' ? 'totp' : 'login',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate credentials' },
      { status: 500 }
    )
  }
}
