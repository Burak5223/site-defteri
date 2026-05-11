#!/usr/bin/env python3

import requests
import json

def test_create_resident_debug():
    base_url = "http://localhost:8080/api"
    
    # Test data - use a different apartment number to avoid conflicts
    test_data = {
        "fullName": "Test Sakin Debug",
        "email": "testsakindebug@example.com", 
        "phone": "0555 999 1234",
        "residentType": "tenant",
        "blockName": "A Blok",
        "unitNumber": "99",  # Use apartment 99 to avoid conflicts
        "siteId": "1",
        "password": "temp123",
        "createProfile": True
    }
    
    print("=== CREATE RESIDENT DEBUG TEST ===")
    print(f"Testing endpoint: {base_url}/users/create-resident")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{base_url}/users/create-resident",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"SUCCESS: {json.dumps(result, indent=2)}")
        else:
            print(f"ERROR Response: {response.text}")
            
            # Try to get more details from the error
            try:
                error_json = response.json()
                print(f"ERROR JSON: {json.dumps(error_json, indent=2)}")
            except:
                print("Could not parse error as JSON")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

    # Also test with apartment 13 to see the specific error
    print("\n" + "="*50)
    print("TESTING WITH APARTMENT 13 (original request)")
    
    test_data_13 = test_data.copy()
    test_data_13["unitNumber"] = "13"
    test_data_13["email"] = "testsakin13@example.com"
    
    try:
        response = requests.post(
            f"{base_url}/users/create-resident",
            json=test_data_13,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"SUCCESS: {json.dumps(result, indent=2)}")
        else:
            print(f"ERROR Response: {response.text}")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_create_resident_debug()