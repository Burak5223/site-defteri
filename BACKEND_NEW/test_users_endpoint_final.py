#!/usr/bin/env python3

import requests
import json

def test_users_endpoint_final():
    """Test the /users endpoint to see if new resident appears"""
    
    base_url = "http://localhost:8080/api"
    
    # Login as admin
    login_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    print("🔐 Logging in as admin...")
    login_response = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    login_result = login_response.json()
    token = login_result.get("accessToken")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Login successful")
    
    # Test /users endpoint
    print("\n👥 Testing /users endpoint...")
    users_response = requests.get(f"{base_url}/users", headers=headers)
    
    if users_response.status_code == 200:
        users = users_response.json()
        print(f"📋 Found {len(users)} users:")
        
        # Look for our test user
        test_user_found = False
        for user in users:
            if "Test Kiracı Site1" in user.get('fullName', ''):
                test_user_found = True
                print(f"✅ Found test user:")
                print(f"   Name: {user.get('fullName')}")
                print(f"   Email: {user.get('email')}")
                print(f"   Block: {user.get('blockName')}")
                print(f"   Unit: {user.get('unitNumber')}")
                print(f"   Type: {user.get('residentType')}")
                print(f"   Roles: {user.get('roles')}")
                break
        
        if not test_user_found:
            print("❌ Test user not found in /users endpoint")
            
        # Show first few users for reference
        print(f"\n📋 First 3 users:")
        for i, user in enumerate(users[:3]):
            print(f"   {i+1}. {user.get('fullName')} - {user.get('blockName')} {user.get('unitNumber')} ({user.get('residentType')})")
            
    else:
        print(f"❌ Failed to get users: {users_response.status_code}")
        print(f"Response: {users_response.text}")

if __name__ == "__main__":
    test_users_endpoint_final()