#!/usr/bin/env python3

import requests
import json

def test_apartment_query():
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
    
    # Get all apartments
    print("\n🏠 Getting all apartments...")
    apartments_response = requests.get(f"{base_url}/apartments", headers=headers)
    
    if apartments_response.status_code == 200:
        apartments = apartments_response.json()
        print(f"📋 Found {len(apartments)} apartments:")
        
        for apt in apartments:
            print(f"   ID: {apt.get('id')}")
            print(f"   Unit: {apt.get('unitNumber')}")
            print(f"   Block: {apt.get('blockName')}")
            print(f"   Site ID: {apt.get('siteId')}")
            print(f"   Block ID: {apt.get('blockId')}")
            print(f"   Status: {apt.get('status')}")
            print("   ---")
            
        # Find apartment 39
        apt_39 = None
        for apt in apartments:
            if str(apt.get('unitNumber')) == '39':
                apt_39 = apt
                break
        
        if apt_39:
            print(f"\n🎯 Apartment 39 details:")
            print(f"   ID: {apt_39.get('id')}")
            print(f"   Unit Number: {apt_39.get('unitNumber')}")
            print(f"   Block Name: {apt_39.get('blockName')}")
            print(f"   Site ID: {apt_39.get('siteId')}")
            print(f"   Block ID: {apt_39.get('blockId')}")
            print(f"   Owner: {apt_39.get('ownerUserId')}")
            print(f"   Current Resident: {apt_39.get('currentResidentId')}")
        else:
            print("❌ Apartment 39 not found")
    else:
        print(f"❌ Failed to get apartments: {apartments_response.status_code}")
        print(f"Response: {apartments_response.text}")

if __name__ == "__main__":
    test_apartment_query()