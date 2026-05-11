#!/usr/bin/env python3

import requests
import json

def test_create_resident_site1_apt39():
    """Test creating a resident for apartment 39 in site 1 (B Blok)"""
    
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
    
    # Test create resident for B Blok apartment 39 (which belongs to site 1)
    print("\n👤 Creating resident for B Blok apartment 39...")
    
    resident_data = {
        "fullName": "Test Kiracı Site1",
        "email": f"test.kiracı.site1@example.com",
        "phone": "+90 555 123 4567",
        "password": "test123",
        "blockName": "B Blok",
        "unitNumber": "39",
        "residentType": "tenant",
        "siteId": "1"
    }
    
    print(f"📋 Resident data: {json.dumps(resident_data, indent=2)}")
    
    create_response = requests.post(f"{base_url}/users/create-resident", 
                                  json=resident_data, 
                                  headers=headers)
    
    print(f"\n📊 Response status: {create_response.status_code}")
    
    if create_response.status_code == 200:
        result = create_response.json()
        print("✅ Resident created successfully!")
        print(f"   User ID: {result.get('id')}")
        print(f"   Full Name: {result.get('fullName')}")
        print(f"   Email: {result.get('email')}")
        print(f"   Status: {result.get('status')}")
    else:
        print(f"❌ Failed to create resident")
        print(f"   Response: {create_response.text}")
        
        # Try to parse error details
        try:
            error_data = create_response.json()
            print(f"   Error details: {json.dumps(error_data, indent=2)}")
        except:
            pass

if __name__ == "__main__":
    test_create_resident_site1_apt39()