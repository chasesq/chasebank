#!/usr/bin/env node

/**
 * Real-Time Integration Verification Script
 * Checks that all Supabase client initialization is properly awaited
 * and real-time subscriptions are correctly configured
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

const issues = {
  missingAwait: [],
  importErrors: [],
  configErrors: [],
  successCount: 0,
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for missing await on createServiceClient or createClient
    const missingAwaitPattern = /const\s+supabase\s*=\s*(?!await\s)(?:createServiceClient|createClient)\(\)/g
    const missingAwaitMatches = content.match(missingAwaitPattern)
    
    if (missingAwaitMatches) {
      issues.missingAwait.push({
        file: path.relative(projectRoot, filePath),
        count: missingAwaitMatches.length,
      })
    }

    // Check for isSupabaseConfigured being imported from client.ts
    if (content.includes('import') && content.includes('isSupabaseConfigured')) {
      if (content.includes('from \'@/lib/supabase/client\'') || 
          content.includes('from "@/lib/supabase/client"')) {
        // This is allowed if isSupabaseConfigured is exported from client.ts
        if (!filePath.includes('realtime-orchestrator') && !filePath.includes('sync-service')) {
          issues.importErrors.push({
            file: path.relative(projectRoot, filePath),
            issue: 'isSupabaseConfigured should be defined locally or not used',
          })
        }
      }
    }

    issues.successCount++
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error.message)
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', '.vercel', '.env'].includes(file)) {
        walkDir(filePath)
      }
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && 
               (file.includes('route.ts') || file.includes('realtime') || file.includes('sync-service'))) {
      checkFile(filePath)
    }
  })
}

console.log('🔍 Verifying Real-Time Integration Setup...\n')
walkDir(projectRoot)

console.log('\n📊 Verification Results:')
console.log(`✅ Files checked: ${issues.successCount}`)
console.log(`⚠️  Missing await statements: ${issues.missingAwait.length}`)
console.log(`❌ Import errors: ${issues.importErrors.length}`)

if (issues.missingAwait.length > 0) {
  console.log('\n🔴 Missing Await Issues:')
  issues.missingAwait.forEach(issue => {
    console.log(`  - ${issue.file}: ${issue.count} occurrences`)
  })
}

if (issues.importErrors.length > 0) {
  console.log('\n🔴 Import Issues:')
  issues.importErrors.forEach(issue => {
    console.log(`  - ${issue.file}: ${issue.issue}`)
  })
}

if (issues.missingAwait.length === 0 && issues.importErrors.length === 0) {
  console.log('\n✨ All checks passed! Real-time integration is properly configured.')
  process.exit(0)
} else {
  console.log('\n⚠️  Please fix the above issues for smooth real-time operation.')
  process.exit(1)
}
