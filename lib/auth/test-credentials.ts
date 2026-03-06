/**
 * Secure Test Credentials for Development & Testing
 * DO NOT use these in production
 */

export interface TestUser {
  username: string
  email: string
  password: string
  phone: string
  accountNumber: string
  accountType: 'primary' | '2fa' | 'passwordless' | 'admin'
  description: string
}

export const TEST_USERS: TestUser[] = [
  {
    username: 'demo.user',
    email: 'demo@chasebanktest.com',
    password: 'ChaseBank@2024!Secure',
    phone: '+1 (555) 123-4567',
    accountNumber: '9876543210',
    accountType: 'primary',
    description: 'Primary test user with standard authentication',
  },
  {
    username: 'demo.2fa',
    email: 'demo2fa@chasebanktest.com',
    password: 'SecureBank@2024!Test',
    phone: '+1 (555) 234-5678',
    accountNumber: '9876543211',
    accountType: '2fa',
    description: 'Test user with 2FA/TOTP enabled',
  },
  {
    username: 'demo.passwordless',
    email: 'demopw@chasebanktest.com',
    password: 'MagicLink@2024!Auth',
    phone: '+1 (555) 345-6789',
    accountNumber: '9876543212',
    accountType: 'passwordless',
    description: 'User configured for passwordless (magic link) authentication',
  },
  {
    username: 'admin.test',
    email: 'admin@chasebanktest.com',
    password: 'AdminAccess@2024!Secure',
    phone: '+1 (555) 999-0000',
    accountNumber: '9876543213',
    accountType: 'admin',
    description: 'Admin test account with elevated permissions',
  },
]

/**
 * Get all test users (for documentation/testing purposes)
 */
export function getAllTestUsers(): TestUser[] {
  return TEST_USERS
}

/**
 * Get a specific test user by email
 */
export function getTestUserByEmail(email: string): TestUser | undefined {
  return TEST_USERS.find((user) => user.email === email)
}

/**
 * Validate if provided credentials match a test user
 */
export function validateTestUserCredentials(email: string, password: string): TestUser | null {
  const user = getTestUserByEmail(email)
  if (!user || user.password !== password) {
    return null
  }
  return user
}

/**
 * Mark a user as a test account (for display purposes)
 */
export function isTestAccount(email: string): boolean {
  return email.includes('@chasebanktest.com') || getTestUserByEmail(email) !== undefined
}

/**
 * Get test user documentation
 */
export function getTestCredentialsMarkdown(): string {
  return `
# Test User Credentials for Chase Bank App

These credentials are for development and testing only. Do not use in production.

## Primary Test User
- **Username:** demo.user
- **Email:** demo@chasebanktest.com
- **Password:** ChaseBank@2024!Secure
- **Phone:** +1 (555) 123-4567
- **Use Case:** Standard authentication testing

## 2FA/TOTP User
- **Username:** demo.2fa
- **Email:** demo2fa@chasebanktest.com
- **Password:** SecureBank@2024!Test
- **Phone:** +1 (555) 234-5678
- **Use Case:** Two-factor authentication and TOTP testing

## Passwordless Login User
- **Username:** demo.passwordless
- **Email:** demopw@chasebanktest.com
- **Password:** MagicLink@2024!Auth
- **Phone:** +1 (555) 345-6789
- **Use Case:** Magic link and passwordless authentication testing

## Admin Test Account
- **Username:** admin.test
- **Email:** admin@chasebanktest.com
- **Password:** AdminAccess@2024!Secure
- **Phone:** +1 (555) 999-0000
- **Use Case:** Administrative functions and elevated permissions testing

## Password Requirements
All passwords meet the following security requirements:
✅ At least 12 characters
✅ Contains uppercase letter
✅ Contains lowercase letter
✅ Contains number
✅ Contains special character
✅ No common patterns

## Features to Test
1. **Standard Login** - Use demo.user credentials
2. **Password Security** - Try changing password with demo.user
3. **Two-Factor Auth** - Login with demo.2fa to test TOTP
4. **Device Management** - Login and select "Remember this device"
5. **Login History** - Check security dashboard for login activity
6. **Account Lockout** - Enter wrong password 3+ times with any user
`
}
