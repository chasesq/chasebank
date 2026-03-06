'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Fingerprint, Face, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AuthCard } from './auth-card'
import { LoginHeader } from './login-header'

interface BiometricLoginProps {
  onSuccess?: () => void
}

export function BiometricLogin({ onSuccess }: BiometricLoginProps) {
  const [step, setStep] = useState<'select' | 'verifying' | 'success' | 'error'>('select')
  const [selectedType, setSelectedType] = useState<'fingerprint' | 'face' | null>(null)
  const [error, setError] = useState('')

  const handleBiometricAuth = async (type: 'fingerprint' | 'face') => {
    setSelectedType(type)
    setStep('verifying')
    setError('')

    try {
      // Simulate biometric verification
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setStep('success')
      onSuccess?.()
    } catch (err) {
      setError('Biometric verification failed. Please try again.')
      setStep('error')
    }
  }

  const isBiometricAvailable = typeof window !== 'undefined' && navigator.credentials !== undefined

  return (
    <AuthCard>
      <LoginHeader />

      {step === 'select' && (
        <div className="space-y-4">
          <h3 className="text-center font-semibold text-slate-900 dark:text-white mb-6">
            Choose your authentication method
          </h3>

          {!isBiometricAvailable && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Biometric authentication is not available on this device</span>
            </div>
          )}

          <button
            onClick={() => handleBiometricAuth('fingerprint')}
            disabled={!isBiometricAvailable}
            className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Fingerprint</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Use your fingerprint to log in</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleBiometricAuth('face')}
            disabled={!isBiometricAvailable}
            className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-center gap-3">
              <Face className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Face ID</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Use your face to log in</div>
              </div>
            </div>
          </button>
        </div>
      )}

      {step === 'verifying' && (
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            {selectedType === 'fingerprint' ? (
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center animate-pulse">
                <Fingerprint className="w-8 h-8 text-blue-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center animate-pulse">
                <Face className="w-8 h-8 text-blue-600" />
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {selectedType === 'fingerprint' ? 'Verifying fingerprint' : 'Verifying face'}...
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Please keep your device steady</p>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verified successfully</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Welcome back to Chase Bank</p>
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          <Button
            onClick={() => setStep('select')}
            variant="outline"
            className="w-full"
          >
            Try again
          </Button>
        </div>
      )}
    </AuthCard>
  )
}
