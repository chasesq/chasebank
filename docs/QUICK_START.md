# Chase Bank Login System - Quick Start Guide

## Test Credentials (Copy & Paste Ready)

### Standard Login
```
Email: demo@chasebanktest.com
Password: ChaseBank@2024!Secure
```

### With 2FA/TOTP
```
Email: demo2fa@chasebanktest.com
Password: SecureBank@2024!Test
```

### Passwordless (Magic Link)
```
Email: demopw@chasebanktest.com
```

### Admin Account
```
Email: admin@chasebanktest.com
Password: AdminAccess@2024!Secure
```

## Features to Test

### 1. Standard Login Flow
1. Navigate to login page
2. Enter `demo@chasebanktest.com`
3. Enter `ChaseBank@2024!Secure`
4. Click "Sign In"
5. Choose to remember device (optional)
6. You're logged in!

### 2. Account Lockout
1. Use any test email
2. Enter wrong password 3 times
3. Account locks for 15 minutes
4. See countdown timer
5. Try again after lockout expires

### 3. Device Management
1. Login to account
2. Check "Remember this device"
3. Give it a name (e.g., "iPhone 15")
4. Login again from same device (no verification needed)
5. Go to settings → devices
6. See trusted device list
7. Remove device to require verification again

### 4. Password Strength
1. During signup or password change
2. See real-time strength meter
3. Requirements shown:
   - ✅ 12+ characters
   - ✅ Uppercase letter
   - ✅ Lowercase letter
   - ✅ Number
   - ✅ Special character
4. Color changes: Red → Yellow → Green

### 5. Two-Factor Authentication (2FA)
1. Login with `demo2fa@chasebanktest.com`
2. Enter password
3. Prompted for 6-digit code
4. Open authenticator app:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
5. Enter code
6. Complete login

### 6. Session Timeout
1. Login to account
2. Leave page inactive for 15 minutes
3. See timeout warning at 13 minutes
4. Warning shows time remaining
5. Click "Continue Session" or auto-logout after timeout

### 7. Multiple Device Sessions
1. Login from different devices/browsers
2. See all active sessions in settings
3. Logout from other devices
4. Devices get logged out immediately
5. See session timestamps

## API Quick Reference

### Check Test Credentials
```bash
curl http://localhost:3000/api/auth/demo
```

### Validate Password
```bash
curl -X POST http://localhost:3000/api/auth/password/validate \
  -H "Content-Type: application/json" \
  -d '{"password":"ChaseBank@2024!Secure"}'
```

### Response:
```json
{
  "valid": true,
  "strength": "strong",
  "strengthScore": 100,
  "requirements": {
    "minimumLength": true,
    "hasUppercase": true,
    "hasLowercase": true,
    "hasNumber": true,
    "hasSpecialChar": true
  }
}
```

### Get Trusted Devices
```bash
curl "http://localhost:3000/api/auth/devices?email=demo@chasebanktest.com"
```

### Get Active Sessions
```bash
curl "http://localhost:3000/api/auth/sessions?userId=USER_ID"
```

## Component Usage Examples

### Using SecureLogin Component
```tsx
import { SecureLogin } from '@/components/secure-login'

export default function LoginPage() {
  const handleLogin = (userId: string) => {
    console.log('User logged in:', userId)
    // Navigate to dashboard
  }

  return <SecureLogin onLogin={handleLogin} />
}
```

### Using Security Services
```tsx
import { loginSecurityService } from '@/lib/auth/login-security-service'

// Check if account is locked
if (loginSecurityService.isAccountLocked(email)) {
  const remaining = loginSecurityService.getLockoutTimeRemaining(email)
  console.log(`Locked for ${remaining}ms`)
}

// Validate password
const validation = loginSecurityService.validatePassword(password)
console.log(validation.valid, validation.errors)
```

### Using Device Fingerprinting
```tsx
import { deviceFingerprintService } from '@/lib/auth/device-fingerprint-service'

// Generate device fingerprint
const fingerprint = deviceFingerprintService.generateFingerprint()

// Trust device for 30 days
deviceFingerprintService.trustDevice(userId, fingerprint.id, 'My Device', 30)

// Check if device is trusted
const isTrusted = deviceFingerprintService.isDeviceTrusted(userId, fingerprint.id)
```

### Using Password Strength Meter
```tsx
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'

export default function PasswordInput() {
  const [password, setPassword] = useState('')

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordStrengthMeter password={password} showRequirements />
    </div>
  )
}
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `components/secure-login.tsx` | Main login component |
| `lib/auth/login-security-service.ts` | Rate limiting & account lockout |
| `lib/auth/device-fingerprint-service.ts` | Device identification |
| `lib/auth/session-manager.ts` | Session lifecycle management |
| `app/api/auth/login/route.ts` | Login API with security |
| `app/api/auth/devices/route.ts` | Device management API |
| `app/api/auth/sessions/route.ts` | Session management API |

## Troubleshooting

### Can't Login?
- Check email spelling
- Password is case-sensitive
- Account might be locked (wait 15 minutes)
- Check browser console for errors

### 2FA Not Working?
- Make sure authenticator app is in sync
- Check that TOTP code hasn't expired (30 seconds)
- Try backup codes if available
- Regenerate TOTP secret if needed

### Device Not Remembered?
- Check "Remember this device" checkbox
- Device must be verified once before trusting
- Trust expires after 30 days
- Clear browser cookies to reset

### Session Timeout Issues?
- Inactivity timeout is 15 minutes
- Warning appears at 2 minutes remaining
- Click "Continue Session" to extend
- Every action resets the timer

## Security Tips

1. **Passwords** - Always 12+ characters with mixed case, numbers, special characters
2. **Devices** - Only trust personal devices you own
3. **Sessions** - Logout from untrusted devices in settings
4. **2FA** - Enable for maximum security
5. **Backup Codes** - Save them in a safe place

## Contact & Support

- Check docs/ folder for detailed documentation
- Review component prop definitions
- Check API endpoint responses for errors
- Enable browser dev tools for debugging

---

**Last Updated:** March 6, 2026
**Status:** Ready for Testing ✅
