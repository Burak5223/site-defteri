#!/usr/bin/env python3
"""
Test script for apartment creation functionality
"""

import requests
import json

# Configuration
BASE_URL = "http://192.168.125.211:8080/api"
ADMIN_EMAIL = "admin@site.com"
ADMIN_PASSWORD = "admin123"

def login():
    """Login and get JWT token"""
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        token = response.json().get("accessToken")
        print(f"✅ Login successful, token: {token[:20]}...")
        return token
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def get_blocks(token):
    """Get available blocks"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/sites/1/blocks", headers=headers)
    if response.status_code == 200:
        blocks = response.json()
        print(f"✅ Found {len(blocks)} blocks")
        for block in blocks:
            print(f"   - Block: {block['name']} (ID: {block['id']})")
        return blocks
    else:
        print(f"❌ Failed to get blocks: {response.status_code} - {response.text}")
        return []

def create_apartment(token, block_id, unit_number, floor):
    """Create a new apartment"""
    headers = {"Authorization": f"Bearer {token}"}
    
    apartment_data = {
        "unitNumber": unit_number,
        "floor": floor
    }
    
    response = requests.post(f"{BASE_URL}/blocks/{block_id}/apartments", 
                           json=apartment_data, headers=headers)
    
    if response.status_code == 201:
        apartment = response.json()
        print(f"✅ Apartment created successfully:")
        print(f"   - Unit Number: {apartment.get('unitNumber')}")
        print(f"   - Floor: {apartment.get('floor')}")
        print(f"   - ID: {apartment.get('id')}")
        return apartment
    else:
        print(f"❌ Failed to create apartment: {response.status_code} - {response.text}")
        return None

def main():
    print("🏢 Testing Apartment Creation API")
    print("=" * 40)
    
    # Step 1: Login
    token = login()
    if not token:
        return
    
    # Step 2: Get blocks
    blocks = get_blocks(token)
    if not blocks:
        print("❌ No blocks found. Please create a block first.")
        return
    
    # Step 3: Create test apartment
    first_block = blocks[0]
    block_id = first_block['id']
    
    print(f"\n🏗️ Creating test apartment in block '{first_block['name']}'...")
    apartment = create_apartment(token, block_id, "TEST-101", 1)
    
    if apartment:
        print("\n✅ Apartment creation test completed successfully!")
    else:
        print("\n❌ Apartment creation test failed!")

if __name__ == "__main__":
    main()