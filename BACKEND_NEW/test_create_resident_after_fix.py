#!/usr/bin/env python3

import requests
import json

def test_create_resident_after_fix():
    """Test creating a resident after fixing apartment occupancy"""
    
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
        print(f"Response: {login_response.text}")
        return False
    
    login_result = login_response.json()
    print(f"Login response: {login_result}")
    token = login_result.get('token') or login_result.get('accessToken')
    
    if not token:
        print("❌ No token received from login")
        return False
    
    print("✅ Login successful")
    
    # Headers with auth token
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test creating a resident in an empty apartment
    print("\n🏠 Testing resident creation...")
    
    # Find an apartment that has only owner (no tenant)
    print("🔍 Looking for apartments with only owner...")
    
    # Try to create a resident in apartment 39 (B Blok)
    resident_data = {
        "fullName": "Test Yeni Kiracı",
        "email": "test.yeni.kiraci@example.com",
        "phone": "+905551234567",
        "password": "test123",
        "siteId": "1",
        "blockName": "B Blok",
        "unitNumber": "39",
        "residentType": "tenant"
    }
    
    print(f"📝 Creating resident: {resident_data['fullName']} in {resident_data['blockName']} {resident_data['unitNumber']}")
    
    create_response = requests.post(f"{base_url}/users/create-resident", 
                                  json=resident_data, 
                                  headers=headers)
    
    print(f"📊 Response status: {create_response.status_code}")
    
    if create_response.status_code == 200:
        result = create_response.json()
        print("✅ Resident created successfully!")
        print(f"   User ID: {result.get('id')}")
        print(f"   Full Name: {result.get('fullName')}")
        print(f"   Email: {result.get('email')}")
        return True
    else:
        print(f"❌ Resident creation failed")
        print(f"Response: {create_response.text}")
        return False

if __name__ == "__main__":
    test_create_resident_after_fix()