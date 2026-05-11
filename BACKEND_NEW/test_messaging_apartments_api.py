#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test messaging apartments API
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_messaging_apartments():
    print("=" * 80)
    print("MESSAGING APARTMENTS API TEST")
    print("=" * 80)
    
    # Login as admin
    print("\n1. Logging in as admin...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "admin@site.com",
            "password": "admin123"
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    login_data = login_response.json()
    token = login_data.get("accessToken")
    site_id = login_data.get("siteId", "1")
    print(f"✅ Login successful! Site ID: {site_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get apartments for messaging
    print(f"\n2. Getting apartments for messaging...")
    apartments_response = requests.get(
        f"{BASE_URL}/sites/{site_id}/messages/apartments",
        headers=headers
    )
    
    if apartments_response.status_code != 200:
        print(f"❌ Failed to get apartments: {apartments_response.status_code}")
        print(apartments_response.text)
        return
    
    apartments = apartments_response.json()
    print(f"✅ Found {len(apartments)} apartments")
    
    # Show first 10 apartments
    print(f"\n3. First 10 apartments:")
    print("-" * 80)
    
    for i, apt in enumerate(apartments[:10]):
        block = apt.get('block', '')
        number = apt.get('number', '')
        resident_name = apt.get('residentName', 'N/A')
        is_member = apt.get('isSiteMember', False)
        
        print(f"\n{i+1}. {block} {number}")
        print(f"   Resident: {resident_name}")
        print(f"   Is Site Member: {is_member}")
        print(f"   Owner ID: {apt.get('ownerId', 'N/A')}")
        print(f"   Owner Name: {apt.get('ownerName', 'N/A')}")
        print(f"   Resident ID: {apt.get('residentId', 'N/A')}")
        print(f"   Tenant Name: {apt.get('tenantName', 'N/A')}")
    
    # Count empty apartments
    empty_count = sum(1 for apt in apartments if apt.get('residentName') == 'Boş Daire')
    filled_count = len(apartments) - empty_count
    
    print(f"\n4. Summary:")
    print(f"   Total apartments: {len(apartments)}")
    print(f"   Filled apartments: {filled_count}")
    print(f"   Empty apartments: {empty_count}")
    
    print("\n" + "=" * 80)
    print("✅ TEST COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    try:
        test_messaging_apartments()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
