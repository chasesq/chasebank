'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft } from 'lucide-react'

interface SecureLoginProps {
  onLogin: (userId: string) => void
}

export function SecureLogin({ onLogin }: SecureLoginProps) {
  const [step, setStep] = useState<'credentials' | 'otp' | 'totp' | 'device'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [totp, setTotp] = useState('')
  const [userId, setUserId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [totpAttempts, setTotpAttempts] = useState(0)
  const [rememberDevice, setRememberDevice] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [isAccountLocked, setIsAccountLocked] = useState(false)
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0)
  const { toast } = useToast()
  
  // Track abort controllers for each request
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter email and password',
        variant: 'destructive',
      })
      return
    }

    // Check if account is locked
    if (loginSecurityService.isAccountLocked(email)) {
      const remaining = loginSecurityService.getLockoutTimeRemaining(email)
      const minutes = Math.ceil(remaining / 60000)
      setIsAccountLocked(true)
      setLockoutTimeRemaining(remaining)
      toast({
        title: 'Account Locked',
        description: `Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        variant: 'destructive',
      })
      return
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
        signal: abortControllerRef.current.signal,
      })

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return

      const data = await response.json()

      if (!response.ok) {
        loginSecurityService.recordLoginAttempt(email, false)
        toast({
          title: 'Login Failed',
          description: data.error || 'Invalid credentials',
          variant: 'destructive',
        })
        return
      }

      // Record successful login attempt
      loginSecurityService.recordLoginAttempt(email, true)

      if (data.requiresTOTP) {
        setUserId(data.userId)
        setStep('totp')
        toast({
          title: 'TOTP Required',
          description: 'Enter the 6-digit code from your authenticator app',
        })
      } else if (data.requiresOTP) {
        setUserId(data.userId)
        setStep('otp')
        toast({
          title: 'OTP Sent',
          description: 'Check your email/SMS for the verification code',
        })
      } else {
        // If no 2FA required, proceed to device selection
        setUserId(data.userId)
        setStep('device')
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      if (!isMountedRef.current) return
      
      console.error('Login error:', error)
      loginSecurityService.recordLoginAttempt(email, false)
      toast({
        title: 'Error',
        description: 'Authentication failed. Please try again.',
        variant: 'destructive',
      })
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [email, password, toast])

  const handleTOTPVerify = useCallback(async () => {
    if (!totp || totp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      })
      return
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-totp',
          userId,
          otp: totp,
        }),
        signal: abortControllerRef.current.signal,
      })

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return

      const data = await response.json()

      if (!response.ok) {
        const newAttempts = totpAttempts + 1
        setTotpAttempts(newAttempts)

        if (newAttempts >= 3) {
          toast({
            title: 'Error',
            description: 'Too many failed attempts. Please try again later.',
            variant: 'destructive',
          })
          setTotp('')
          setTotpAttempts(0)
          setStep('credentials')
        } else {
          toast({
            title: 'Invalid Code',
            description: `${data.error || 'Please check and try again'} (${3 - newAttempts} attempts remaining)`,
            variant: 'destructive',
          })
          setTotp('')
        }
        return
      }

      toast({
        title: 'Success',
        description: 'TOTP verification successful',
      })

      setTotp('')
      setTotpAttempts(0)
      setStep('device')
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[v0] TOTP verification request was cancelled')
        return
      }

      if (!isMountedRef.current) return

      console.error('[v0] TOTP verification error:', error)
      toast({
        title: 'Error',
        description: 'Verification failed. Please try again.',
        variant: 'destructive',
      })
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [totp, userId, onLogin, toast, totpAttempts])

  const handleOTPVerify = useCallback(async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      })
      return
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          userId,
          otp,
        }),
        signal: abortControllerRef.current.signal,
      })

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'OTP Verification Failed',
          description: data.error || 'Invalid code',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Verification successful',
      })

      setStep('device')
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[v0] OTP verification request was cancelled')
        return
      }

      if (!isMountedRef.current) return
      
      console.error('[v0] OTP verification error:', error)
      toast({
        title: 'Error',
        description: 'Verification failed. Please try again.',
        variant: 'destructive',
      })
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [otp, userId, onLogin, toast])

  // Device Selection Step
  const handleCompleteLogin = async () => {
    if (rememberDevice) {
      const fingerprint = deviceFingerprintService.generateFingerprint()
      deviceFingerprintService.trustDevice(userId, fingerprint.id, deviceName)
      const session = sessionManager.createSession(userId, fingerprint.id)
      // Store session in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('sessionId', session.sessionId)
      }
    }
    onLogin(userId)
  }

  if (step === 'device') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-4">
        <AuthCard title="Complete Login" subtitle="Secure your device">
          <LoginHeader />
          <div className="space-y-6">
            <SecurityBadge type="secure" message="All communications are encrypted" />
            <DeviceSelector onRememberDeviceChange={setRememberDevice} onDeviceNameChange={setDeviceName} />
            <Button onClick={handleCompleteLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
              Finish Login
            </Button>
          </div>
        </AuthCard>
      </div>
    )
  }

  if (step === 'totp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-4">
        <AuthCard title="Verify Your Identity" subtitle="Enter your authenticator code">
          <LoginHeader />
          <div className="space-y-6">
            <SecurityBadge type="info" message="6-digit code from your authenticator app" />

            <div className="space-y-2">
              <Label htmlFor="totp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Authenticator Code
              </Label>
              <Input
                id="totp"
                type="text"
                placeholder="000000"
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center tracking-widest font-mono text-2xl bg-white dark:bg-slate-800"
                autoFocus
              />
              {totpAttempts > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {3 - totpAttempts} attempt{3 - totpAttempts !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>

            <Button
              onClick={handleTOTPVerify}
              disabled={isLoading || totp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <button
              onClick={() => {
                setStep('credentials')
                setTotp('')
                setTotpAttempts(0)
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Login
            </button>
          </div>
        </AuthCard>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-4">
        <AuthCard title="Verify Your Email" subtitle="Enter the code we sent you">
          <LoginHeader />
          <div className="space-y-6">
            <SecurityBadge type="info" message={`Code sent to ${email}`} />

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center tracking-widest font-mono text-2xl bg-white dark:bg-slate-800"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">Code expires in 5 minutes</p>
            </div>

            <Button
              onClick={handleOTPVerify}
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <button
              onClick={() => setStep('credentials')}
              className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Login
            </button>
          </div>
        </AuthCard>
      </div>
    )
  }

  if (isAccountLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-4">
        <AuthCard>
          <LoginHeader />
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-semibold mb-1">Account Temporarily Locked</p>
                <p>Too many failed login attempts. Please try again in {Math.ceil(lockoutTimeRemaining / 60000)} minute(s).</p>
              </div>
            </div>
            <Button
              onClick={() => setIsAccountLocked(false)}
              variant="outline"
              className="w-full"
            >
              Try Again Later
            </Button>
          </div>
        </AuthCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-4">
      <AuthCard title="Secure Login" subtitle="Access your Chase Bank account">
        <LoginHeader />

        <div className="space-y-6">
          <SecurityBadge type="secure" message="Bank-level encryption" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={!email || !password || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span>Encrypted connection • Bank-level security</span>
          </div>
        </div>
      </AuthCard>
    </div>
  )
}
