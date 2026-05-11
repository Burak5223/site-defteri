#!/usr/bin/env python3

import requests
import json
import random

def test_final_resident_creation():
    """Test creating a resident after restoring deleted residents"""
    
    base_url = "http://localhost:8080/api"
    
    # Login as admin first
    login_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    print("🔐 Logging in as admin...")
    login_response = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    login_result = login_response.json()
    token = login_result.get('accessToken')
    
    print("✅ Login successful")
    
    # Headers with auth token
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test creating residents in different scenarios
    test_cases = [
        {
            "name": "Test Yeni Sakin Final",
            "email": f"test.final.{random.randint(1000,9999)}@example.com",
            "phone": f"+9055512345{random.randint(10,99)}",
            "blockName": "A Blok",
            "unitNumber": "7",  # Should have only owner
            "residentType": "tenant",
            "description": "Adding tenant to owner-only apartment"
        },
        {
            "name": "Test Yeni Malik Final",
            "email": f"test.malik.final.{random.randint(1000,9999)}@example.com", 
            "phone": f"+9055512346{random.randint(10,99)}",
            "blockName": "B Blok",
            "unitNumber": "64",  # Should have only tenant
            "residentType": "owner",
            "description": "Adding owner to tenant-only apartment"
        }
    ]
    
    success_count = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🏠 Test {i}: {test_case['description']}")
        
        resident_data = {
            "fullName": test_case["name"],
            "email": test_case["email"],
            "phone": test_case["phone"],
            "password": "test123",
            "siteId": "1",
            "blockName": test_case["blockName"],
            "unitNumber": test_case["unitNumber"],
            "residentType": test_case["residentType"]
        }
        
        print(f"📝 Creating {test_case['residentType']}: {test_case['name']} in {test_case['blockName']} {test_case['unitNumber']}")
        
        create_response = requests.post(f"{base_url}/users/create-resident", 
                                      json=resident_data, 
                                      headers=headers)
        
        print(f"📊 Response status: {create_response.status_code}")
        
        if create_response.status_code == 200:
            result = create_response.json()
            print("✅ Resident created successfully!")
            print(f"   User ID: {result.get('id')}")
            print(f"   Full Name: {result.get('fullName')}")
            success_count += 1
        else:
            print(f"❌ Resident creation failed")
            print(f"Response: {create_response.text}")
    
    print(f"\n📊 Final Results: {success_count}/{len(test_cases)} residents created successfully")
    return success_count == len(test_cases)

if __name__ == "__main__":
    test_final_resident_creation()