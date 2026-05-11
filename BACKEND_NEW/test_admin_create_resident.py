#!/usr/bin/env python3

import requests
import json

# Test the create-resident endpoint from AdminResidents screen
def test_admin_create_resident():
    base_url = "http://localhost:8080/api"
    
    # Test data for creating a resident
    test_data = {
        "fullName": "Test Sakin Admin",
        "email": "testsakinadmin@example.com", 
        "phone": "0555 999 8877",
        "residentType": "tenant",
        "blockName": "A Blok",
        "unitNumber": "13",
        "siteId": "1",
        "password": "temp123",
        "createProfile": True
    }
    
    print("=== ADMIN CREATE RESIDENT TEST ===")
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
            
            # Verify the user was created by checking /users endpoint
            users_response = requests.get(f"{base_url}/users")
            if users_response.status_code == 200:
                users = users_response.json()
                created_user = next((u for u in users if u.get('email') == test_data['email']), None)
                if created_user:
                    print(f"\nVERIFICATION SUCCESS: User found in /users endpoint")
                    print(f"Created user: {json.dumps(created_user, indent=2)}")
                else:
                    print(f"\nVERIFICATION FAILED: User not found in /users endpoint")
            
        else:
            print(f"ERROR: {response.text}")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_admin_create_resident()