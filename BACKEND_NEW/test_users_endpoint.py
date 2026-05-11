#!/usr/bin/env python3
"""
Test the /users endpoint that mobile app uses
"""
import requests
import json

print("=" * 80)
print("TESTING /users ENDPOINT")
print("=" * 80)

# 1. Login as admin to get token
print("\n1. Logging in as admin...")
try:
    login_response = requests.post("http://localhost:8080/api/auth/login", 
                                 json={
                                     "email": "admin@site.com",
                                     "password": "admin123"
                                 })
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        token = login_data.get('accessToken')
        print(f"✅ Admin login successful")
        headers = {"Authorization": f"Bearer {token}"}
    else:
        print(f"❌ Admin login failed: {login_response.status_code}")
        exit(1)
        
except Exception as e:
    print(f"❌ Login failed: {e}")
    exit(1)

# 2. Test /users endpoint
print(f"\n2. Testing /users endpoint...")
try:
    response = requests.get("http://localhost:8080/api/users", headers=headers)
    
    if response.status_code == 200:
        users_data = response.json()
        print(f"✅ API returned {len(users_data)} users")
        
        # Filter users with apartment info
        users_with_apartments = [u for u in users_data if u.get('blockName') and u.get('unitNumber')]
        print(f"✅ Users with apartments: {len(users_with_apartments)}")
        
        # Show first few users
        print(f"\n📋 Sample users with apartments:")
        for i, user in enumerate(users_with_apartments[:10]):
            name = user.get('fullName')
            email = user.get('email')
            block = user.get('blockName')
            unit = user.get('unitNumber')
            resident_type = user.get('residentType', 'N/A')
            
            print(f"   {i+1}. {name} ({email})")
            print(f"      🏠 {block} - Daire {unit}")
            print(f"      👤 Type: {resident_type}")
            print()
            
        # Look for specific users
        print(f"\n🔍 Looking for specific users:")
        
        # Look for Sakin User
        sakin_users = [u for u in users_data if 'sakin' in u.get('fullName', '').lower() or 'sakin' in u.get('email', '').lower()]
        if sakin_users:
            print(f"✅ Found {len(sakin_users)} sakin user(s):")
            for user in sakin_users:
                name = user.get('fullName')
                email = user.get('email')
                block = user.get('blockName')
                unit = user.get('unitNumber')
                print(f"   - {name} ({email}) - {block} - {unit}")
        else:
            print("❌ No sakin users found")
            
        # Look for Ali Doğan
        ali_users = [u for u in users_data if 'ali' in u.get('fullName', '').lower() and 'doğan' in u.get('fullName', '').lower()]
        if ali_users:
            print(f"✅ Found {len(ali_users)} Ali Doğan user(s):")
            for user in ali_users:
                name = user.get('fullName')
                email = user.get('email')
                block = user.get('blockName')
                unit = user.get('unitNumber')
                print(f"   - {name} ({email}) - {block} - {unit}")
        else:
            print("❌ No Ali Doğan users found")
            
        # Look for Elif Kılıç
        elif_users = [u for u in users_data if 'elif' in u.get('fullName', '').lower() and 'kılıç' in u.get('fullName', '').lower()]
        if elif_users:
            print(f"✅ Found {len(elif_users)} Elif Kılıç user(s):")
            for user in elif_users:
                name = user.get('fullName')
                email = user.get('email')
                block = user.get('blockName')
                unit = user.get('unitNumber')
                print(f"   - {name} ({email}) - {block} - {unit}")
        else:
            print("❌ No Elif Kılıç users found")
            
    else:
        print(f"❌ API request failed: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ API request failed: {e}")

print("\n" + "=" * 80)
print("/users ENDPOINT TEST COMPLETED")
print("=" * 80)