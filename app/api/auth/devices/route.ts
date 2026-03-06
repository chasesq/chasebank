import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { deviceFingerprintService } from '@/lib/auth/device-fingerprint-service'

interface Device {
  id: string
  name: string
  lastUsed: string
  isCurrentDevice: boolean
  type?: string
  browser?: string
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    const deviceId = request.nextUrl.searchParams.get('deviceId')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Get user's devices
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, totp_devices')
      .eq('email', email)

    if (findError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]
    let devices: Device[] = []

    // Get trusted devices from fingerprint service
    const trustedDevices = deviceFingerprintService.getTrustedDevices(user.id)
    
    if (trustedDevices.length > 0) {
      devices = trustedDevices.map(device => ({
        id: device.fingerprintId,
        name: device.name,
        lastUsed: new Date(device.lastUsed).toISOString(),
        isCurrentDevice: device.fingerprintId === deviceId,
        type: 'trusted',
      }))
    }

    // Also check legacy format if it exists
    if (user.totp_devices) {
      try {
        const legacyDevices = JSON.parse(user.totp_devices)
        devices = [...devices, ...legacyDevices.map((d: any) => ({
          ...d,
          isCurrentDevice: d.id === deviceId,
        }))]
      } catch (error) {
        console.error('Failed to parse legacy devices:', error)
      }
    }

    return NextResponse.json({
      success: true,
      devices,
      trustedDeviceCount: trustedDevices.length,
    })
  } catch (error) {
    console.error('[v0] Devices endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, deviceId, deviceName } = await request.json()

    if (!email || !deviceId || !deviceName) {
      return NextResponse.json(
        { error: 'Email, deviceId, and deviceName are required' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Get user
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, totp_devices')
      .eq('email', email)

    if (findError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Use fingerprint service to trust the device
    const device = deviceFingerprintService.trustDevice(
      user.id,
      deviceId,
      deviceName,
      30 // 30 days
    )

    // Also update legacy format for compatibility
    let devices: Device[] = []
    if (user.totp_devices) {
      try {
        devices = JSON.parse(user.totp_devices)
      } catch (error) {
        console.error('Failed to parse existing devices:', error)
      }
    }

    const existingDeviceIndex = devices.findIndex(d => d.id === deviceId)
    if (existingDeviceIndex >= 0) {
      devices[existingDeviceIndex].lastUsed = new Date().toISOString()
    } else {
      devices.push({
        id: deviceId,
        name: deviceName,
        lastUsed: new Date().toISOString(),
        isCurrentDevice: false,
      })
    }

    // Update user record for legacy format
    await supabase
      .from('users')
      .update({
        totp_devices: JSON.stringify(devices),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      device: {
        id: device.fingerprintId,
        name: device.name,
        createdAt: new Date(device.createdAt).toISOString(),
        expiresAt: new Date(device.expiresAt).toISOString(),
      },
      message: 'Device registered successfully',
    })
  } catch (error) {
    console.error('[v0] Register device error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email, deviceId } = await request.json()

    if (!email || !deviceId) {
      return NextResponse.json(
        { error: 'Email and deviceId are required' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Get user
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, totp_devices')
      .eq('email', email)

    if (findError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Use fingerprint service to remove the device
    deviceFingerprintService.removeTrustedDevice(user.id, deviceId)

    // Also remove from legacy format for compatibility
    let devices: Device[] = []
    if (user.totp_devices) {
      try {
        devices = JSON.parse(user.totp_devices)
      } catch (error) {
        console.error('Failed to parse devices:', error)
      }
    }

    devices = devices.filter(d => d.id !== deviceId)

    // Update user record for legacy format
    await supabase
      .from('users')
      .update({
        totp_devices: JSON.stringify(devices),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      message: 'Device removed successfully',
    })
  } catch (error) {
    console.error('[v0] Remove device error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
