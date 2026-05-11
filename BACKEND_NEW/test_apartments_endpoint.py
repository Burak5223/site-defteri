#!/usr/bin/env python3
"""
Test /api/users/me/apartments endpoint
"""
import requests
import json

# Login first
login_url = "http://localhost:8080/api/auth/login"
login_data = {
    "email": "sakin@site.com",
    "password": "sakin123"
}

print("🔐 Logging in as sakin@site.com...")
login_response = requests.post(login_url, json=login_data)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

login_result = login_response.json()
token = login_result.get('accessToken')
print(f"✅ Login successful! Token: {token[:20]}...")

# Test apartments endpoint
apartments_url = "http://localhost:8080/api/users/me/apartments"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print(f"\n📡 Testing {apartments_url}...")
apartments_response = requests.get(apartments_url, headers=headers)

print(f"Status Code: {apartments_response.status_code}")
print(f"\nResponse:")
print(json.dumps(apartments_response.json(), indent=2, ensure_ascii=False))

if apartments_response.status_code == 200:
    apartments = apartments_response.json()
    print(f"\n✅ Found {len(apartments)} apartment(s):")
    for apt in apartments:
        print(f"   - {apt.get('blockName')} - {apt.get('unitNumber')} ({apt.get('assignmentType')})")
else:
    print(f"\n❌ Request failed!")
