#!/usr/bin/env python3
"""
Test super admin login
"""
import requests
import json

BASE_URL = "http://localhost:8080/api"

print("=== Testing Super Admin Login ===\n")

# Test 1: super123 (correct)
print("Test 1: superadmin@site.com / super123")
print("-" * 60)

login_data = {
    "email": "superadmin@site.com",
    "password": "super123"
}

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ LOGIN SUCCESS")
        print(f"  Token: {result.get('accessToken', '')[:50]}...")
        print(f"  User: {result.get('user', {}).get('fullName')}")
        print(f"  Email: {result.get('user', {}).get('email')}")
    else:
        print(f"❌ LOGIN FAILED")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: superadmin123 (wrong)
print("\n\nTest 2: superadmin@site.com / superadmin123")
print("-" * 60)

login_data2 = {
    "email": "superadmin@site.com",
    "password": "superadmin123"
}

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data2)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"✓ LOGIN SUCCESS (unexpected!)")
    else:
        print(f"✓ LOGIN FAILED (expected)")
        print(f"  Response: {response.text[:100]}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*60)
print("CORRECT CREDENTIALS:")
print("="*60)
print("Email: superadmin@site.com")
print("Password: super123")
print("="*60)
