import requests
import json

base_url = "http://localhost:8080/api/auth/login"

test_users = [
    {'email': 'admin@site.com', 'password': 'admin123', 'expected_role': 'ADMIN'},
    {'email': 'sakin@site.com', 'password': 'sakin123', 'expected_role': 'RESIDENT'},
    {'email': 'guvenlik@site.com', 'password': 'guvenlik123', 'expected_role': 'SECURITY'},
    {'email': 'temizlik@site.com', 'password': 'temizlik123', 'expected_role': 'CLEANING'},
    {'email': 'superadmin@site.com', 'password': 'superadmin123', 'expected_role': 'SUPER_ADMIN'}
]

print("=== TESTING ALL USER LOGINS ===\n")

for user in test_users:
    print(f"Testing: {user['email']}")
    
    response = requests.post(base_url, json={
        'email': user['email'],
        'password': user['password']
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"  ✓ Login successful!")
        print(f"  Role: {data.get('role', 'N/A')}")
        print(f"  Site ID: {data.get('siteId', 'N/A')}")
        print(f"  Token: {data.get('token', '')[:50]}...")
    else:
        print(f"  ✗ Login failed!")
        print(f"  Status: {response.status_code}")
        print(f"  Error: {response.text}")
    
    print()

print("=== TEST COMPLETE ===")
