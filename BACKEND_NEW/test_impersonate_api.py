#!/usr/bin/env python3
"""
Test impersonate API endpoint
"""
import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=== Testing Impersonate Feature ===\n")

# Step 1: Login as super admin
print("Step 1: Login as Super Admin")
print("-" * 60)

login_data = {
    "email": "superadmin@site.com",
    "password": "super123"
}

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        auth_response = response.json()
        super_admin_token = auth_response.get('accessToken')
        print(f"✓ Super Admin logged in successfully")
        print(f"Token: {super_admin_token[:50]}...")
        print(f"User: {auth_response.get('user', {}).get('fullName')}")
        print(f"Roles: {auth_response.get('user', {}).get('roles')}")
    else:
        print(f"❌ Login failed: {response.text}")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Step 2: Get all sites
print("\n\nStep 2: Get All Sites")
print("-" * 60)

headers = {
    "Authorization": f"Bearer {super_admin_token}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(f"{BASE_URL}/sites", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        sites = response.json()
        print(f"✓ Found {len(sites)} sites:\n")
        for site in sites:
            print(f"  {site.get('id')}: {site.get('name')}")
    else:
        print(f"❌ Failed: {response.text}")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Step 3: Test impersonate for each site
print("\n\nStep 3: Test Impersonate for Each Site")
print("=" * 60)

test_results = []

for site in sites:
    site_id = site.get('id')
    site_name = site.get('name')
    
    print(f"\n{site_name} (ID: {site_id})")
    print("-" * 60)
    
    impersonate_data = {
        "siteId": str(site_id)
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/super-admin/impersonate",
            headers=headers,
            json=impersonate_data
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                admin_token = result.get('accessToken')
                admin_user = result.get('user', {})
                
                print(f"✓ Impersonate SUCCESS")
                print(f"  Admin Email: {admin_user.get('email')}")
                print(f"  Admin Name: {admin_user.get('fullName')}")
                print(f"  Site: {admin_user.get('siteName')}")
                print(f"  Token: {admin_token[:50]}...")
                
                test_results.append({
                    'site': site_name,
                    'status': 'SUCCESS',
                    'admin': admin_user.get('email')
                })
            else:
                print(f"❌ Impersonate FAILED: {result.get('message')}")
                test_results.append({
                    'site': site_name,
                    'status': 'FAILED',
                    'error': result.get('message')
                })
        else:
            error_msg = response.text
            print(f"❌ HTTP Error: {error_msg}")
            test_results.append({
                'site': site_name,
                'status': 'ERROR',
                'error': error_msg
            })
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        test_results.append({
            'site': site_name,
            'status': 'EXCEPTION',
            'error': str(e)
        })

# Summary
print("\n\n" + "=" * 60)
print("SUMMARY")
print("=" * 60 + "\n")

success_count = sum(1 for r in test_results if r['status'] == 'SUCCESS')
failed_count = len(test_results) - success_count

print(f"Total Sites: {len(test_results)}")
print(f"Success: {success_count}")
print(f"Failed: {failed_count}\n")

for result in test_results:
    status_icon = "✓" if result['status'] == 'SUCCESS' else "❌"
    print(f"{status_icon} {result['site']}: {result['status']}")
    if result['status'] == 'SUCCESS':
        print(f"   Admin: {result['admin']}")
    else:
        print(f"   Error: {result.get('error', 'Unknown')}")

if success_count == len(test_results):
    print("\n✓ All impersonate tests PASSED!")
else:
    print(f"\n⚠️  {failed_count} test(s) FAILED")
