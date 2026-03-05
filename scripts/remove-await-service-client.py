import os
import re

def fix_await_service_client():
    base_path = "/vercel/share/v0-project"
    api_routes = [
        "app/api/zelle/route.ts",
        "app/api/alerts/stream/route.ts",
        "app/api/transfers/route.ts",
        "app/api/transactions/route.ts",
        "app/api/admin/users/route.ts",
        "app/api/settings/route.ts",
        "app/api/admin/transfers/route.ts",
        "app/api/accounts/route.ts",
        "app/api/notifications/route.ts",
        "app/api/notifications/sms/route.ts",
        "app/api/notifications/push/route.ts",
        "app/api/devices/register/route.ts",
        "app/api/notifications/preferences/route.ts",
        "app/api/dashboard/route.ts",
        "app/api/credit/route.ts",
        "app/api/credit/journey/route.ts",
        "app/api/bill-pay/route.ts",
        "app/api/auth/route.ts",
        "app/api/auth/verify-authorized-user/route.ts",
        "app/api/auth/verify-alt-identity/route.ts",
        "app/api/auth/settings/route.ts",
        "app/api/auth/password/route.ts",
        "app/api/auth/devices/route.ts",
        "app/api/auth/profile/route.ts",
        "app/api/auth/2fa/verify/route.ts",
        "app/api/auth/2fa/login-verify/route.ts",
        "app/api/auth/2fa/sync/route.ts",
        "app/api/auth/2fa/setup/route.ts",
    ]
    
    fixed_count = 0
    
    for route in api_routes:
        file_path = os.path.join(base_path, route)
        if not os.path.exists(file_path):
            continue
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        original_content = content
        # Replace: await createServiceClient()  with: createServiceClient()
        content = content.replace("await createServiceClient()", "createServiceClient()")
        
        if content != original_content:
            with open(file_path, 'w') as f:
                f.write(content)
            fixed_count += 1
            print(f"✓ Fixed: {route}")
    
    print(f"\n✨ Complete! Fixed {fixed_count} files")

if __name__ == "__main__":
    fix_await_service_client()
