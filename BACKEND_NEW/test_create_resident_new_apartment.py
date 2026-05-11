#!/usr/bin/env python3

import requests
import json

def test_create_resident_new_apartment():
    """Test creating a resident for a new apartment"""
    
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
    token = login_result.get("token") or login_result.get("accessToken")
    if not token:
        print("No token found in login response")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful")
    
    # Test creating a resident for apartment 13 (which has owner but no tenant)
    resident_data = {
        "fullName": "Test Kiracı 13",
        "email": "test.kiraci13@example.com",
        "phone": "+905551111111",  # Using a completely unique phone number
        "password": "test123",
        "siteId": "1",
        "blockName": "A Blok",
        "unitNumber": "13",
        "residentType": "tenant"
    }
    
    print("\n=== Creating resident for apartment 13 (empty tenant slot) ===")
    print(f"Data: {json.dumps(resident_data, indent=2)}")
    
    create_response = requests.post(f"{base_url}/users/create-resident", 
                                  json=resident_data, 
                                  headers=headers)
    
    print(f"Response Status: {create_response.status_code}")
    print(f"Response: {create_response.text}")
    
    if create_response.status_code == 200:
        print("✓ Resident created successfully!")
        
        # Verify the resident was created
        user_data = create_response.json()
        print(f"Created user ID: {user_data.get('id')}")
        print(f"User name: {user_data.get('fullName')}")
        print(f"User email: {user_data.get('email')}")
        
        return True
    else:
        print("✗ Failed to create resident")
        return False

if __name__ == "__main__":
    test_create_resident_new_apartment()