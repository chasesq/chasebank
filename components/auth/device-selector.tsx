'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Smartphone, Laptop, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeviceSelectorProps {
  onDeviceNameChange?: (name: string) => void
  onRememberDeviceChange?: (remember: boolean) => void
  detectedDeviceType?: 'mobile' | 'desktop' | 'tablet'
}

export function DeviceSelector({
  onDeviceNameChange,
  onRememberDeviceChange,
  detectedDeviceType = 'desktop',
}: DeviceSelectorProps) {
  const [rememberDevice, setRememberDevice] = useState(false)
  const [deviceName, setDeviceName] = useState('')

  const handleRememberChange = (checked: boolean) => {
    setRememberDevice(checked)
    onRememberDeviceChange?.(checked)
  }

  const handleDeviceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeviceName(e.target.value)
    onDeviceNameChange?.(e.target.value)
  }

  const getDeviceIcon = () => {
    return detectedDeviceType === 'mobile' ? (
      <Smartphone className="w-5 h-5 text-blue-600" />
    ) : (
      <Laptop className="w-5 h-5 text-blue-600" />
    )
  }

  return (
    <div className="space-y-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex items-center h-6">{getDeviceIcon()}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">This device will be remembered for 30 days</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You won't need to verify your identity on this device during this time.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="remember-device" checked={rememberDevice} onCheckedChange={handleRememberChange} />
          <Label htmlFor="remember-device" className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
            Remember this device
          </Label>
        </div>

        {rememberDevice && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="device-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Device name (optional)
            </Label>
            <Input
              id="device-name"
              placeholder="e.g., iPhone 15, Work Laptop"
              value={deviceName}
              onChange={handleDeviceNameChange}
              className="text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-950 p-2 rounded">
        <AlertCircle className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <span>Only enable this on personal devices you trust</span>
      </div>
    </div>
  )
}
