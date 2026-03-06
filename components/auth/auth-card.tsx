'use client'

import type React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function AuthCard({ children, className, title, subtitle }: AuthCardProps) {
  return (
    <Card className={cn('w-full max-w-md mx-auto bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-800', className)}>
      <div className="p-8">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </Card>
  )
}
