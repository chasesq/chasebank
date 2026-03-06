#!/usr/bin/env node
/**
 * Seed Test Users Script
 * Creates test user accounts with secure credentials
 * Run with: npx ts-node scripts/seed-test-users.ts
 */

import { createServiceClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/password-utils'
import { TEST_USERS } from '@/lib/auth/test-credentials'

async function seedTestUsers() {
  console.log('Starting test user seeding...')

  try {
    const supabase = await createServiceClient()

    for (const testUser of TEST_USERS) {
      console.log(`\nCreating test user: ${testUser.email}`)

      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', testUser.email)
        .single()

      if (existing) {
        console.log(`  ✓ User already exists with ID: ${existing.id}`)
        continue
      }

      // Hash the password
      const hashedPassword = await hashPassword(testUser.password)

      // Create the user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([
          {
            email: testUser.email,
            name: testUser.username,
            password_hash: hashedPassword,
            phone: testUser.phone,
            role: testUser.accountType === 'admin' ? 'admin' : 'user',
            two_factor_enabled: testUser.accountType === '2fa',
            created_at: new Date().toISOString(),
            last_login: null,
          },
        ])
        .select()

      if (userError) {
        console.error(`  ✗ Error creating user: ${userError.message}`)
        continue
      }

      const userId = newUser[0]?.id
      console.log(`  ✓ User created with ID: ${userId}`)

      // Create a checking account for the user
      const { error: accountError } = await supabase
        .from('accounts')
        .insert([
          {
            user_id: userId,
            name: 'Total Checking',
            account_type: 'checking',
            account_number: testUser.accountNumber.slice(-4),
            full_account_number: testUser.accountNumber,
            routing_number: '021000021',
            balance: 5000.0, // Give test users $5000 to play with
            available_balance: 5000.0,
            interest_rate: 0.01,
            status: 'active',
            created_at: new Date().toISOString(),
          },
        ])

      if (accountError) {
        console.error(`  ✗ Error creating account: ${accountError.message}`)
      } else {
        console.log(`  ✓ Checking account created`)
      }

      // If 2FA user, create TOTP secret
      if (testUser.accountType === '2fa') {
        // In production, generate a real TOTP secret
        const totpSecret = 'JBSWY3DPEBLW64TMMQ======'
        const { error: totpError } = await supabase
          .from('users')
          .update({
            totp_secret: totpSecret,
          })
          .eq('id', userId)

        if (totpError) {
          console.error(`  ✗ Error setting TOTP: ${totpError.message}`)
        } else {
          console.log(`  ✓ TOTP secret configured`)
        }
      }

      console.log(`  ✓ Test user setup complete`)
    }

    console.log('\n✅ Test user seeding completed successfully!')
    console.log('\nTest Credentials:')
    TEST_USERS.forEach((user) => {
      console.log(`  - ${user.email} / ${user.password}`)
    })
  } catch (error) {
    console.error('❌ Error seeding test users:', error)
    process.exit(1)
  }
}

seedTestUsers()
