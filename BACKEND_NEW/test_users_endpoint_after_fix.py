#!/usr/bin/env python3
"""
Test /users endpoint after replacing Ali Doğan and Elif Kılıç with Sakin User
"""
import requests
import json

# Test the /users endpoint
print("=" * 80)
print("TESTING /users ENDPOINT AFTER REPLACEMENT")
print("=" * 80)

try:
    # Login first to get token
    login_response = requests.post('http://localhost:8080/api/auth/login', json={
        'email': 'admin@site.com',
        'password': 'admin123'
    })
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        print(f"Login response: {login_data}")
        token = login_data.get('token') or login_data.get('accessToken')
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test /users endpoint
        response = requests.get('http://localhost:8080/api/users', headers=headers)
        
        if response.status_code == 200:
            users = response.json()
            print(f"✅ /users endpoint returned {len(users)} users")
            
            # Check for Sakin User
            sakin_users = [u for u in users if 'Sakin' in u.get('fullName', '')]
            print(f"✅ Found {len(sakin_users)} Sakin User(s)")
            
            for user in sakin_users:
                print(f"   - {user['fullName']} ({user.get('blockName', 'No block')} - Daire {user.get('unitNumber', 'No unit')})")
            
            # Check for Ali Doğan
            ali_users = [u for u in users if 'Ali' in u.get('fullName', '') and 'Doğan' in u.get('fullName', '')]
            print(f"✅ Found {len(ali_users)} Ali Doğan user(s)")
            
            for user in ali_users:
                print(f"   - {user['fullName']} ({user.get('blockName', 'No block')} - Daire {user.get('unitNumber', 'No unit')})")
            
            # Check for Elif Kılıç
            elif_users = [u for u in users if 'Elif' in u.get('fullName', '') and 'Kılıç' in u.get('fullName', '')]
            print(f"✅ Found {len(elif_users)} Elif Kılıç user(s)")
            
            for user in elif_users:
                print(f"   - {user['fullName']} ({user.get('blockName', 'No block')} - Daire {user.get('unitNumber', 'No unit')})")
            
            # Check specific apartments
            print(f"\n📍 Checking specific apartments:")
            
            # A Blok Daire 12
            a12_users = [u for u in users if u.get('blockName') == 'A Blok' and u.get('unitNumber') == '12']
            if a12_users:
                print(f"   A Blok Daire 12: {a12_users[0]['fullName']} ({a12_users[0].get('residentType', 'unknown')})")
            else:
                print(f"   A Blok Daire 12: No user found")
            
            # B Blok Daire 36
            b36_users = [u for u in users if u.get('blockName') == 'B Blok' and u.get('unitNumber') == '36']
            if b36_users:
                print(f"   B Blok Daire 36: {b36_users[0]['fullName']} ({b36_users[0].get('residentType', 'unknown')})")
            else:
                print(f"   B Blok Daire 36: No user found")
                
        else:
            print(f"❌ /users endpoint failed: {response.status_code}")
            print(response.text)
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)

except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 80)
print("TEST COMPLETED")
print("=" * 80)