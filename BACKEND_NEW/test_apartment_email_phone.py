#!/usr/bin/env python3
"""Test that apartment API returns email and phone fields for residents"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

# Login as admin
login_data = {
    "email": "admin@site.com",
    "password": "admin123"
}

print("Logging in as admin...")
response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
if response.status_code != 200:
    print(f"❌ Login failed: {response.status_code}")
    print(response.text)
    exit(1)

auth_response = response.json()
token = auth_response.get('token') or auth_response.get('accessToken')
if not token:
    print(f"❌ No token in response: {auth_response}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}
print("✓ Login successful")

# Get blocks
print("\nFetching blocks...")
response = requests.get(f"{BASE_URL}/sites/1/blocks", headers=headers)
if response.status_code != 200:
    print(f"❌ Failed to get blocks: {response.status_code}")
    exit(1)

blocks = response.json()
print(f"✓ Found {len(blocks)} blocks")

# Get apartments for first block
if blocks:
    block_id = blocks[0]['id']
    block_name = blocks[0]['name']
    print(f"\nFetching apartments for block {block_name}...")
    
    response = requests.get(f"{BASE_URL}/blocks/{block_id}/apartments", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get apartments: {response.status_code}")
        exit(1)
    
    apartments = response.json()
    print(f"✓ Found {len(apartments)} apartments")
    
    # Check first apartment with residents
    for apt in apartments[:3]:
        print(f"\n--- Daire {apt.get('unitNumber')} ---")
        print(f"Owner: {apt.get('ownerName', 'N/A')}")
        print(f"Owner Email: {apt.get('ownerEmail', 'N/A')}")
        print(f"Owner Phone: {apt.get('ownerPhone', 'N/A')}")
        print(f"Current Resident: {apt.get('currentResidentName', 'N/A')}")
        print(f"Current Resident Email: {apt.get('currentResidentEmail', 'N/A')}")
        print(f"Current Resident Phone: {apt.get('currentResidentPhone', 'N/A')}")
        
        # Verify fields exist
        if apt.get('ownerName'):
            if apt.get('ownerEmail') and apt.get('ownerPhone'):
                print("✓ Owner email and phone fields present")
            else:
                print("❌ Owner email or phone fields missing!")
        
        if apt.get('currentResidentName') and apt.get('currentResidentId') != apt.get('ownerUserId'):
            if apt.get('currentResidentEmail') and apt.get('currentResidentPhone'):
                print("✓ Tenant email and phone fields present")
            else:
                print("❌ Tenant email or phone fields missing!")

print("\n✓ Test completed")
