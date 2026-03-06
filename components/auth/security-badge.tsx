'use client'

import { Badge } from '@/components/ui/badge'
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SecurityBadgeProps {
  type: 'secure' | 'warning' | 'info'
  message: string
  className?: string
}

export function SecurityBadge({ type, message, className }: SecurityBadgeProps) {
  const getIcon = () => {
    switch (type) {
      case 'secure':
        return <CheckCircle2 className="w-4 h-4" />
      case 'warning':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'secure':
        return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      default:
        return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border', getStyles(), className)}>
      {getIcon()}
      <span>{message}</span>
    </div>
  )
}
