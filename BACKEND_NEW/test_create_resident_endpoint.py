#!/usr/bin/env python3
"""
Test the new create-resident endpoint
"""
import requests
import json

print("=" * 80)
print("TESTING CREATE RESIDENT ENDPOINT")
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
        
        # Test create resident endpoint
        resident_data = {
            'fullName': 'Test Sakin 13',
            'email': 'testsakin13@site.com',
            'phone': '0555 123 1313',
            'blockName': 'A Blok',
            'unitNumber': '13',
            'residentType': 'owner',
            'siteId': '1',
            'password': 'test123',
            'createProfile': True
        }
        
        print(f"📤 Creating resident: {resident_data['fullName']} in {resident_data['blockName']} Daire {resident_data['unitNumber']}")
        
        response = requests.post('http://localhost:8080/api/users/create-resident', 
                               json=resident_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Resident created successfully!")
            print(f"   ID: {result.get('id')}")
            print(f"   Name: {result.get('fullName')}")
            print(f"   Email: {result.get('email')}")
            print(f"   Status: {result.get('status')}")
            
            # Test if resident appears in /users endpoint
            print(f"\n📋 Checking if resident appears in /users endpoint...")
            users_response = requests.get('http://localhost:8080/api/users', headers=headers)
            
            if users_response.status_code == 200:
                users = users_response.json()
                
                # Find our new resident
                new_resident = None
                for user in users:
                    if user.get('email') == resident_data['email']:
                        new_resident = user
                        break
                
                if new_resident:
                    print(f"✅ New resident found in /users endpoint:")
                    print(f"   Name: {new_resident['fullName']}")
                    print(f"   Block: {new_resident.get('blockName', 'None')}")
                    print(f"   Unit: {new_resident.get('unitNumber', 'None')}")
                    print(f"   Type: {new_resident.get('residentType', 'None')}")
                else:
                    print(f"❌ New resident NOT found in /users endpoint")
            else:
                print(f"❌ Failed to fetch /users: {users_response.status_code}")
                
        else:
            print(f"❌ Create resident failed: {response.status_code}")
            print(f"Response: {response.text}")
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)

except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 80)
print("TEST COMPLETED")
print("=" * 80)