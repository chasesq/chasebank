'use client'

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordStrengthMeterProps {
  password: string
  showRequirements?: boolean
}

interface PasswordRequirement {
  label: string
  met: boolean
}

export function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([])
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    const checks: PasswordRequirement[] = [
      { label: 'At least 12 characters', met: password.length >= 12 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Contains number', met: /\d/.test(password) },
      { label: 'Contains special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ]

    setRequirements(checks)

    // Calculate strength
    const metCount = checks.filter((c) => c.met).length
    setStrength((metCount / checks.length) * 100)
  }, [password])

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-slate-200'
    if (strength < 40) return 'bg-red-500'
    if (strength < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength === 0) return 'No password'
    if (strength < 40) return 'Weak'
    if (strength < 70) return 'Fair'
    return 'Strong'
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password strength</span>
          <span className={cn('text-xs font-semibold', strength === 0 ? 'text-slate-500' : strength < 40 ? 'text-red-500' : strength < 70 ? 'text-yellow-500' : 'text-green-500')}>
            {getStrengthText()}
          </span>
        </div>
        <Progress value={strength} className="h-2" />
      </div>

      {showRequirements && password && (
        <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
          {requirements.map((req) => (
            <div key={req.label} className="flex items-center gap-2 text-xs">
              {req.met ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
              )}
              <span className={cn('text-slate-600 dark:text-slate-400', req.met && 'text-green-600 dark:text-green-400')}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
