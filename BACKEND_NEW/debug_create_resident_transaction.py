#!/usr/bin/env python3

import requests
import json

# Test the create-resident endpoint with detailed debugging
def test_create_resident():
    base_url = "http://localhost:8080/api"
    
    # First login as admin
    login_data = {
        "email": "admin@site.com",
        "password": "admin123"
    }
    
    print("🔐 Logging in as admin...")
    login_response = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    login_result = login_response.json()
    print(f"📋 Login response: {json.dumps(login_result, indent=2)}")
    
    token = login_result.get("accessToken")
    if not token:
        print("❌ No accessToken in login response")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Login successful")
    
    # Check apartment 39 status first
    print("\n🏠 Checking apartment 39 status...")
    try:
        apartments_response = requests.get(f"{base_url}/apartments", headers=headers)
        if apartments_response.status_code == 200:
            apartments = apartments_response.json()
            apt_39 = None
            for apt in apartments:
                if str(apt.get('unitNumber')) == '39':
                    apt_39 = apt
                    break
            
            if apt_39:
                print(f"📋 Apartment 39 found:")
                print(f"   ID: {apt_39.get('id')}")
                print(f"   Block: {apt_39.get('blockName')}")
                print(f"   Owner: {apt_39.get('ownerUserId')} ({apt_39.get('ownerName', 'N/A')})")
                print(f"   Current Resident: {apt_39.get('currentResidentId')} ({apt_39.get('currentResidentName', 'N/A')})")
                print(f"   Status: {apt_39.get('status')}")
            else:
                print("❌ Apartment 39 not found")
        else:
            print(f"❌ Failed to get apartments: {apartments_response.status_code}")
    except Exception as e:
        print(f"❌ Error checking apartments: {e}")
    
    # Try to create a resident for apartment 39
    print("\n👤 Creating resident for apartment 39...")
    
    resident_data = {
        "fullName": "Test Kiracı 39",
        "email": "testkiraci39@yesilvadi.com",
        "phone": "+90 555 999 3939",
        "residentType": "tenant",
        "blockName": "A Blok",
        "unitNumber": "39",
        "siteId": "1",  # Use the correct site ID from login response
        "password": "temp123"
    }
    
    print(f"📤 Request data: {json.dumps(resident_data, indent=2)}")
    
    try:
        response = requests.post(f"{base_url}/users/create-resident", json=resident_data, headers=headers)
        
        print(f"\n📥 Response status: {response.status_code}")
        print(f"📥 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Resident created successfully!")
            result = response.json()
            print(f"📋 Created user: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Failed to create resident")
            print(f"Response: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"📋 Error details: {json.dumps(error_data, indent=2)}")
            except:
                pass
                
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_create_resident()