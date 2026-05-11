#!/usr/bin/env python3
"""
Test the residents endpoint to verify all 97 users appear
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("TESTING RESIDENTS ENDPOINT")
print("=" * 80)
print()

# First, login as one of the test users to get a token
print("1. Logging in as test user...")
print("-" * 80)
login_data = {
    "email": "ali.korkmaz15@yesilvadi.com",
    "password": "password123"
}

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        auth_data = response.json()
        token = auth_data.get('accessToken')
        user_id = auth_data.get('user', {}).get('id')
        print(f"✓ Login successful!")
        print(f"  User ID: {user_id}")
        print(f"  Token: {token[:50]}...")
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  Response: {response.text}")
        exit(1)
except Exception as e:
    print(f"✗ Error during login: {e}")
    exit(1)

print()

# Test the /api/users endpoint (returns users from same site)
print("2. Testing /api/users endpoint (same site users)...")
print("-" * 80)
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(f"{BASE_URL}/users", headers=headers)
    if response.status_code == 200:
        users = response.json()
        print(f"✓ Endpoint successful!")
        print(f"  Total users returned: {len(users)}")
        
        # Show first 5 users
        print(f"\n  First 5 users:")
        for i, user in enumerate(users[:5], 1):
            print(f"    {i}. {user.get('fullName')} - {user.get('email')}")
            if user.get('blockName') and user.get('unitNumber'):
                print(f"       Apartment: {user.get('blockName')} - {user.get('unitNumber')}")
                print(f"       Type: {user.get('residentType', 'N/A')}")
        
        # Count users with apartments
        users_with_apartments = [u for u in users if u.get('blockName') and u.get('unitNumber')]
        print(f"\n  Users with apartment info: {len(users_with_apartments)}")
        
        # Count by block
        blocks = {}
        for user in users_with_apartments:
            block = user.get('blockName', 'Unknown')
            blocks[block] = blocks.get(block, 0) + 1
        
        print(f"\n  Distribution by block:")
        for block, count in sorted(blocks.items()):
            print(f"    {block}: {count} users")
        
        # Count by resident type
        types = {}
        for user in users_with_apartments:
            res_type = user.get('residentType', 'Unknown')
            types[res_type] = types.get(res_type, 0) + 1
        
        print(f"\n  Distribution by type:")
        for res_type, count in sorted(types.items()):
            print(f"    {res_type}: {count} users")
            
    else:
        print(f"✗ Endpoint failed: {response.status_code}")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ Error during request: {e}")

print()

# Test the /api/sites/1/users endpoint (admin endpoint)
print("3. Testing /api/sites/1/users endpoint (admin only)...")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/sites/1/users", headers=headers)
    if response.status_code == 200:
        users = response.json()
        print(f"✓ Endpoint successful!")
        print(f"  Total users returned: {len(users)}")
    elif response.status_code == 403:
        print(f"⚠ Access denied (expected - user is not admin)")
    else:
        print(f"✗ Endpoint failed: {response.status_code}")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ Error during request: {e}")

print()
print("=" * 80)
print("SUMMARY:")
print("=" * 80)
print("The /api/users endpoint returns users from the same site.")
print("All 97 residents should be visible in the mobile app's residents page.")
print("=" * 80)
