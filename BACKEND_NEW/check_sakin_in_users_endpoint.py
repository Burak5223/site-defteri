#!/usr/bin/env python3
"""
Check if Sakin User appears in /users endpoint
"""
import requests
import json

print("=" * 80)
print("CHECKING SAKIN USER IN /users ENDPOINT")
print("=" * 80)

try:
    # Login first to get token
    login_response = requests.post('http://localhost:8080/api/auth/login', json={
        'email': 'admin@site.com',
        'password': 'admin123'
    })
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        token = login_data.get('accessToken')
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test /users endpoint
        response = requests.get('http://localhost:8080/api/users', headers=headers)
        
        if response.status_code == 200:
            users = response.json()
            print(f"✅ /users endpoint returned {len(users)} users")
            
            # Find Sakin User
            sakin_user = None
            for user in users:
                if 'Sakin' in user.get('fullName', ''):
                    sakin_user = user
                    break
            
            if sakin_user:
                print(f"✅ Found Sakin User in /users endpoint:")
                print(f"   Name: {sakin_user['fullName']}")
                print(f"   Block: {sakin_user.get('blockName', 'None')}")
                print(f"   Unit: {sakin_user.get('unitNumber', 'None')}")
                print(f"   Type: {sakin_user.get('residentType', 'None')}")
                print(f"   ID: {sakin_user.get('id', 'None')}")
            else:
                print(f"❌ Sakin User NOT found in /users endpoint")
                
                # Show all users with apartment info
                print(f"\n📋 All users with apartment info:")
                for user in users:
                    if user.get('blockName') and user.get('unitNumber'):
                        print(f"   {user['fullName']} - {user.get('blockName')} Daire {user.get('unitNumber')} ({user.get('residentType', 'unknown')})")
            
        else:
            print(f"❌ /users endpoint failed: {response.status_code}")
            print(response.text)
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)

except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 80)
print("CHECK COMPLETED")
print("=" * 80)