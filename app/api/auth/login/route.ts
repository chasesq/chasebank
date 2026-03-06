/**
 * Enhanced Secure Login Endpoint
 * Implements rate limiting, account lockout, and security logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/password-utils'
import { loginSecurityService } from '@/lib/auth/login-security-service'
import { deviceFingerprintService } from '@/lib/auth/device-fingerprint-service'

/**
 * POST /api/auth/login - Secure user login with rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if account is locked
    if (loginSecurityService.isAccountLocked(email)) {
      const remaining = loginSecurityService.getLockoutTimeRemaining(email)
      const minutes = Math.ceil(remaining / 60000)

      return NextResponse.json(
        {
          error: 'Account locked due to too many failed login attempts',
          lockoutTimeRemaining: remaining,
          retryAfterMinutes: minutes,
        },
        { status: 429 }
      )
    }

    // Initialize Supabase client
    const supabase = await createServiceClient()

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, two_factor_enabled, name')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // Record failed attempt
      loginSecurityService.recordLoginAttempt(email, false)

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash)

    if (!passwordValid) {
      // Record failed attempt
      loginSecurityService.recordLoginAttempt(email, false)

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Record successful login attempt
    loginSecurityService.recordLoginAttempt(email, true)

    // Generate device fingerprint for this login
    const fingerprint = deviceFingerprintService.generateFingerprint()

    // Get user's IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Update last login time
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        last_login_ip: ipAddress,
      })
      .eq('id', user.id)

    // Prepare response based on 2FA status
    const response = {
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      requiresOTP: false,
      requiresTOTP: user.two_factor_enabled,
      deviceFingerprint: fingerprint.id,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Login endpoint error:', error)
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }
}
