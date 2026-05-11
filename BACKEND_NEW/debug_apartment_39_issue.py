#!/usr/bin/env python3

import requests
import json

def debug_apartment_39():
    base_url = "http://localhost:8080/api"
    
    print("=== DAIRE 39 DEBUG ===")
    
    # First check current apartments and users
    try:
        print("\n1. Checking current apartments...")
        apartments_response = requests.get(f"{base_url}/apartments")
        if apartments_response.status_code == 200:
            apartments = apartments_response.json()
            apt_39 = [apt for apt in apartments if apt.get('unitNumber') == '39']
            
            if apt_39:
                print(f"Found apartment 39:")
                for apt in apt_39:
                    print(f"  ID: {apt.get('id')}")
                    print(f"  Block: {apt.get('blockName')}")
                    print(f"  Unit: {apt.get('unitNumber')}")
                    print(f"  Owner: {apt.get('ownerUserId')}")
                    print(f"  Current Resident: {apt.get('currentResidentId')}")
                    print(f"  Status: {apt.get('status')}")
            else:
                print("No apartment 39 found")
        else:
            print(f"Failed to get apartments: {apartments_response.status_code}")
    
    except Exception as e:
        print(f"Error checking apartments: {e}")
    
    # Check current users
    try:
        print("\n2. Checking current users...")
        users_response = requests.get(f"{base_url}/users")
        if users_response.status_code == 200:
            users = users_response.json()
            print(f"Total users: {len(users)}")
            
            # Check for any test users
            test_users = [u for u in users if 'test' in u.get('email', '').lower() or 'test' in u.get('fullName', '').lower()]
            print(f"Test users found: {len(test_users)}")
            for user in test_users[:5]:  # Show first 5
                print(f"  {user.get('fullName')} ({user.get('email')})")
        else:
            print(f"Failed to get users: {users_response.status_code}")
    
    except Exception as e:
        print(f"Error checking users: {e}")
    
    # Now try to create a resident for apartment 39
    print("\n3. Testing create resident for apartment 39...")
    
    test_data = {
        "fullName": "Test Kiracı 39",
        "email": "testkiraci39@example.com", 
        "phone": "0555 999 3939",
        "residentType": "tenant",
        "blockName": "A Blok",
        "unitNumber": "39",
        "siteId": "1",
        "password": "temp123",
        "createProfile": True
    }
    
    try:
        response = requests.post(
            f"{base_url}/users/create-resident",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            # Try with a different apartment number to see if it's apartment-specific
            print("\n4. Testing with apartment 88 (should work)...")
            test_data_88 = test_data.copy()
            test_data_88["unitNumber"] = "88"
            test_data_88["email"] = "testkiraci88@example.com"
            
            response_88 = requests.post(
                f"{base_url}/users/create-resident",
                json=test_data_88,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Apartment 88 Response Status: {response_88.status_code}")
            print(f"Apartment 88 Response: {response_88.text}")
            
    except Exception as e:
        print(f"Error testing create resident: {e}")

if __name__ == "__main__":
    debug_apartment_39()