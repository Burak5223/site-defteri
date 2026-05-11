#!/usr/bin/env python3

import requests
import json

def fix_apartment_site_ids():
    """Fix all apartments to have site_id = '1' since they all belong to the same site"""
    
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
    
    if apartments_response.status_code != 200:
        print(f"❌ Failed to get apartments: {apartments_response.status_code}")
        return
    
    apartments = apartments_response.json()
    print(f"📋 Found {len(apartments)} apartments")
    
    # Count apartments with null site_id
    null_site_count = sum(1 for apt in apartments if apt.get('siteId') is None)
    print(f"🔍 Found {null_site_count} apartments with null site_id")
    
    if null_site_count == 0:
        print("✅ All apartments already have site_id set")
        return
    
    # Update apartments via direct database query
    print(f"\n🔧 Updating {null_site_count} apartments to have site_id = '1'...")
    
    # Use a simple SQL update via the test endpoint
    update_sql = "UPDATE apartments SET site_id = '1' WHERE site_id IS NULL"
    
    # Try to execute via a test endpoint or direct database connection
    # For now, let's use a manual approach by updating each apartment
    
    updated_count = 0
    for apt in apartments:
        if apt.get('siteId') is None:
            apt_id = apt.get('id')
            print(f"   Updating apartment {apt.get('unitNumber')} (ID: {apt_id})")
            
            # We'll need to use a direct database update since there's no API endpoint
            # This will be done via SQL
            updated_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   Total apartments: {len(apartments)}")
    print(f"   Apartments needing update: {null_site_count}")
    print(f"   Ready to update: {updated_count}")
    
    print(f"\n⚠️  Manual SQL needed:")
    print(f"   Execute this SQL in your database:")
    print(f"   UPDATE apartments SET site_id = '1' WHERE site_id IS NULL;")
    
    return update_sql

if __name__ == "__main__":
    sql = fix_apartment_site_ids()
    print(f"\nSQL to execute: {sql}")