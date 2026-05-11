#!/usr/bin/env python3

import requests
import json

def check_apartment_39_status():
    base_url = "http://localhost:8080/api"
    
    print("=== DAIRE 39 DURUM KONTROLÜ ===")
    
    # Test endpoint to check if backend is working
    try:
        test_response = requests.get(f"{base_url}/test")
        print(f"Backend test: {test_response.status_code}")
    except Exception as e:
        print(f"Backend test failed: {e}")
        return
    
    # Try to create a test user first to see if the issue is apartment-specific
    print("\n1. Testing with a new apartment (77)...")
    
    test_data_77 = {
        "fullName": "Test Kiracı 77",
        "email": "testkiraci77@example.com", 
        "phone": "0555 999 7777",
        "residentType": "tenant",
        "blockName": "A Blok",
        "unitNumber": "77",
        "siteId": "1",
        "password": "temp123",
        "createProfile": True
    }
    
    # We need to authenticate first - let's try with admin credentials
    print("2. Trying to authenticate as admin...")
    
    auth_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    try:
        auth_response = requests.post(f"{base_url}/auth/login", json=auth_data)
        print(f"Auth response: {auth_response.status_code}")
        
        if auth_response.status_code == 200:
            auth_result = auth_response.json()
            token = auth_result.get('accessToken')  # Changed from 'token' to 'accessToken'
            
            if token:
                print("✓ Authentication successful")
                
                # Now try to create resident with authentication
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                print("\n3. Testing create resident with apartment 77...")
                response_77 = requests.post(
                    f"{base_url}/users/create-resident",
                    json=test_data_77,
                    headers=headers
                )
                
                print(f"Apartment 77 Response: {response_77.status_code}")
                if response_77.status_code == 200:
                    print("✓ Apartment 77 creation successful")
                else:
                    print(f"✗ Apartment 77 creation failed: {response_77.text}")
                
                # Now try apartment 39
                print("\n4. Testing create resident with apartment 39...")
                test_data_39 = test_data_77.copy()
                test_data_39["unitNumber"] = "39"
                test_data_39["email"] = "testkiraci39@example.com"
                test_data_39["fullName"] = "Test Kiracı 39"
                
                response_39 = requests.post(
                    f"{base_url}/users/create-resident",
                    json=test_data_39,
                    headers=headers
                )
                
                print(f"Apartment 39 Response: {response_39.status_code}")
                if response_39.status_code == 200:
                    print("✓ Apartment 39 creation successful")
                else:
                    print(f"✗ Apartment 39 creation failed: {response_39.text}")
                    
                    # Try to get more details about apartment 39
                    print("\n5. Checking apartment 39 details...")
                    apartments_response = requests.get(f"{base_url}/apartments", headers=headers)
                    if apartments_response.status_code == 200:
                        apartments = apartments_response.json()
                        apt_39 = [apt for apt in apartments if str(apt.get('unitNumber')) == '39']
                        if apt_39:
                            print(f"Apartment 39 found:")
                            for apt in apt_39:
                                print(f"  Block: {apt.get('blockName')}")
                                print(f"  Owner: {apt.get('ownerUserId')}")
                                print(f"  Current Resident: {apt.get('currentResidentId')}")
                                print(f"  Status: {apt.get('status')}")
                        else:
                            print("No apartment 39 found in database")
            else:
                print("✗ No token received")
        else:
            print(f"✗ Authentication failed: {auth_response.text}")
            
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    check_apartment_39_status()