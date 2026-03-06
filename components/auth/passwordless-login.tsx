'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle2, Clock } from 'lucide-react'
import { AuthCard } from './auth-card'
import { LoginHeader } from './login-header'

interface PasswordlessLoginProps {
  onSuccess?: (email: string) => void
}

export function PasswordlessLogin({ onSuccess }: PasswordlessLoginProps) {
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      // Simulate sending magic link
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStep('verify')
    } catch (error) {
      console.error('Error sending magic link:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard>
      <LoginHeader />

      {step === 'email' && (
        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white dark:bg-slate-800"
              required
            />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            We'll send you a secure magic link to log in without a password.
          </p>

          <Button
            type="submit"
            disabled={!email || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>
      )}

      {step === 'verify' && (
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Check your email</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Click the link in your email to sign in securely.
          </p>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Link expires in 10 minutes. Check your spam folder if you don't see the email.</span>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setStep('email')
              setEmail('')
            }}
          >
            Try a different email
          </Button>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Logged in successfully</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Welcome back to Chase Bank</p>
        </div>
      )}
    </AuthCard>
  )
}
