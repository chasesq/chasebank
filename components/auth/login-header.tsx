'use client'

import Image from 'next/image'
import { Shield, Lock } from 'lucide-react'

interface LoginHeaderProps {
  showSecurityBadge?: boolean
}

export function LoginHeader({ showSecurityBadge = true }: LoginHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">C</span>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Chase Bank</h2>
      {showSecurityBadge && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full py-2 px-4 w-fit mx-auto">
          <Lock className="w-3 h-3" />
          <span>Secure Connection</span>
        </div>
      )}
    </div>
  )
}
