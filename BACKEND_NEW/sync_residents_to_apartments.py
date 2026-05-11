#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync residents data to apartments table
Gets data from residents endpoint and updates apartments
"""

import requests
import mysql.connector
import json

BASE_URL = "http://localhost:8080/api"

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

def sync_residents_to_apartments():
    print("=" * 80)
    print("SYNC RESIDENTS TO APARTMENTS")
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
        return
    
    login_data = login_response.json()
    token = login_data.get("accessToken")
    site_id = login_data.get("siteId", "1")
    print(f"✅ Login successful!")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get residents from API
    print(f"\n2. Getting residents from API...")
    residents_response = requests.get(
        f"{BASE_URL}/sites/{site_id}/residents",
        headers=headers
    )
    
    if residents_response.status_code != 200:
        print(f"❌ Failed to get residents: {residents_response.status_code}")
        print(residents_response.text)
        return
    
    residents = residents_response.json()
    print(f"✅ Found {len(residents)} residents")
    
    # Group residents by apartment
    apartments_map = {}
    for resident in residents:
        apt_id = resident.get('apartmentId')
        if not apt_id:
            continue
        
        if apt_id not in apartments_map:
            apartments_map[apt_id] = {
                'owners': [],
                'tenants': []
            }
        
        resident_type = resident.get('residentType', '').lower()
        user_id = resident.get('userId')
        full_name = resident.get('fullName')
        
        if 'owner' in resident_type or 'malik' in resident_type:
            apartments_map[apt_id]['owners'].append({
                'id': user_id,
                'name': full_name
            })
        elif 'tenant' in resident_type or 'kiracı' in resident_type:
            apartments_map[apt_id]['tenants'].append({
                'id': user_id,
                'name': full_name
            })
    
    print(f"\n3. Grouped residents into {len(apartments_map)} apartments")
    
    # Update apartments table
    print(f"\n4. Updating apartments table...")
    updated_count = 0
    
    for apt_id, data in apartments_map.items():
        owners = data['owners']
        tenants = data['tenants']
        
        # Set owner_user_id (first owner)
        owner_id = owners[0]['id'] if owners else None
        
        # Set current_resident_id (first tenant, or owner if no tenant)
        if tenants:
            resident_id = tenants[0]['id']
        elif owners:
            resident_id = owners[0]['id']
        else:
            resident_id = None
        
        # Update apartment
        update_query = """
            UPDATE apartments 
            SET owner_user_id = %s, current_resident_id = %s
            WHERE id = %s
        """
        
        cursor.execute(update_query, (owner_id, resident_id, apt_id))
        updated_count += 1
    
    conn.commit()
    print(f"✅ Updated {updated_count} apartments")
    
    # Verify updates
    print(f"\n5. Verifying updates...")
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN owner_user_id IS NOT NULL THEN 1 ELSE 0 END) as with_owner,
            SUM(CASE WHEN current_resident_id IS NOT NULL THEN 1 ELSE 0 END) as with_resident
        FROM apartments
        WHERE site_id = '1'
    """)
    
    stats = cursor.fetchone()
    print(f"   Total apartments: {stats['total']}")
    print(f"   With owner: {stats['with_owner']}")
    print(f"   With resident: {stats['with_resident']}")
    
    print("\n" + "=" * 80)
    print("✅ SYNC COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    try:
        sync_residents_to_apartments()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()
