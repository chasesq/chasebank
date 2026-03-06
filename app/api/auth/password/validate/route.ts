/**
 * Password Validation Endpoint
 * Validates passwords against security requirements
 */

import { NextRequest, NextResponse } from 'next/server'
import { loginSecurityService } from '@/lib/auth/login-security-service'

/**
 * POST /api/auth/password/validate - Validate password strength
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Use security service validation
    const validation = loginSecurityService.validatePassword(password)

    // Calculate strength score (0-100)
    const requirementsChecks = [
      password.length >= 12,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    ]

    const strengthScore = (requirementsChecks.filter(Boolean).length / requirementsChecks.length) * 100

    let strengthLevel: 'weak' | 'fair' | 'good' | 'strong' = 'weak'
    if (strengthScore >= 100) {
      strengthLevel = 'strong'
    } else if (strengthScore >= 80) {
      strengthLevel = 'good'
    } else if (strengthScore >= 60) {
      strengthLevel = 'fair'
    }

    return NextResponse.json({
      valid: validation.valid,
      strength: strengthLevel,
      strengthScore,
      errors: validation.errors,
      requirements: {
        minimumLength: password.length >= 12,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate password' },
      { status: 500 }
    )
  }
}
