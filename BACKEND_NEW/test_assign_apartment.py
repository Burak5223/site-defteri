#!/usr/bin/env python3
"""Test apartment assignment functionality"""

import requests
import json

BASE_URL = "http://10.50.19.185:8080/api"

def login():
    """Login as admin"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@site.com",
        "password": "admin123"
    })
    if response.status_code == 200:
        data = response.json()
        token = data.get('accessToken') or data.get('token')
        print(f"✓ Login successful")
        return token
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(response.text)
        return None

def get_users(token):
    """Get all users"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users", headers=headers)
    if response.status_code == 200:
        users = response.json()
        print(f"\n✓ Found {len(users)} users")
        # Find a resident (not admin, security, or cleaning)
        residents = [u for u in users if u.get('role') not in ['ADMIN', 'SECURITY', 'CLEANING']]
        if residents:
            resident = residents[0]
            print(f"  Selected resident: {resident['fullName']} (ID: {resident['id']})")
            return resident
        return None
    else:
        print(f"✗ Get users failed: {response.status_code}")
        return None

def get_blocks(token):
    """Get all blocks"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/sites/1/blocks", headers=headers)
    if response.status_code == 200:
        blocks = response.json()
        print(f"\n✓ Found {len(blocks)} blocks")
        return blocks
    else:
        print(f"✗ Get blocks failed: {response.status_code}")
        return []

def get_apartments(token, block_id):
    """Get apartments for a block"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/blocks/{block_id}/apartments-with-residents", headers=headers)
    if response.status_code == 200:
        apartments = response.json()
        print(f"  Block {block_id}: {len(apartments)} apartments")
        return apartments
    else:
        print(f"✗ Get apartments failed: {response.status_code}")
        return []

def assign_apartment(token, user_id, apartment_id, assignment_type):
    """Assign apartment to user"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "apartmentId": apartment_id,
        "assignmentType": assignment_type
    }
    print(f"\n→ Assigning apartment {apartment_id} to user {user_id} as {assignment_type}")
    response = requests.post(f"{BASE_URL}/users/{user_id}/assign-apartment", 
                            headers=headers, 
                            json=data)
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Assignment successful!")
        print(f"  User: {result.get('fullName')}")
        print(f"  Apartment: {result.get('apartmentNumber')}")
        return True
    else:
        print(f"✗ Assignment failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return False

def main():
    print("=" * 60)
    print("Testing Apartment Assignment Functionality")
    print("=" * 60)
    
    # Login
    token = login()
    if not token:
        return
    
    # Get a resident
    resident = get_users(token)
    if not resident:
        print("✗ No residents found")
        return
    
    # Get blocks and apartments
    blocks = get_blocks(token)
    if not blocks:
        print("✗ No blocks found")
        return
    
    all_apartments = []
    for block in blocks:
        apartments = get_apartments(token, block['id'])
        for apt in apartments:
            apt['blockName'] = block['name']
        all_apartments.extend(apartments)
    
    print(f"\n✓ Total apartments across all blocks: {len(all_apartments)}")
    
    # Find an apartment that the resident is not already in
    current_apartment_id = resident.get('apartmentId')
    available_apartments = [apt for apt in all_apartments if apt['id'] != current_apartment_id]
    
    if not available_apartments:
        print("✗ No available apartments for assignment")
        return
    
    # Select first available apartment
    target_apartment = available_apartments[0]
    print(f"\n→ Target apartment: {target_apartment['blockName']} - Daire {target_apartment['unitNumber']}")
    
    # Assign apartment
    success = assign_apartment(token, resident['id'], target_apartment['id'], 'owner')
    
    if success:
        print("\n" + "=" * 60)
        print("✓ TEST PASSED: Apartment assignment working!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("✗ TEST FAILED: Apartment assignment not working")
        print("=" * 60)

if __name__ == "__main__":
    main()
