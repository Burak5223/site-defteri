#!/usr/bin/env python3

import requests
import json

def test_create_resident_apartment_39():
    """Test creating a resident for apartment 39 which already exists"""
    
    base_url = "http://localhost:8080/api"
    
    # First login as admin
    login_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    print("=== Logging in as admin ===")
    login_response = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        print(login_response.text)
        return False
    
    login_result = login_response.json()
    print(f"Login response: {login_result}")
    
    token = login_result.get("token") or login_result.get("accessToken")
    if not token:
        print("No token found in login response")
        return False
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✓ Login successful")
    
    # Test creating a resident for apartment 39 (which already exists)
    resident_data = {
        "fullName": "Test Kiracı 39",
        "email": "test.kiraci39@example.com",
        "phone": "+905551234567",
        "password": "test123",
        "siteId": "1",
        "blockName": "B Blok",
        "unitNumber": "39",
        "residentType": "tenant"
    }
    
    print("\n=== Creating resident for existing apartment 39 ===")
    print(f"Data: {json.dumps(resident_data, indent=2)}")
    
    create_response = requests.post(f"{base_url}/users/create-resident", 
                                  json=resident_data, 
                                  headers=headers)
    
    print(f"Response Status: {create_response.status_code}")
    print(f"Response: {create_response.text}")
    
    if create_response.status_code == 200:
        print("✓ Resident created successfully!")
        return True
    else:
        print("✗ Failed to create resident")
        return False

if __name__ == "__main__":
    test_create_resident_apartment_39()