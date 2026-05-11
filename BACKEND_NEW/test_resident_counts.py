#!/usr/bin/env python3
"""
Test script to verify resident counts are consistent across all endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_resident_counts():
    print("=" * 80)
    print("TESTING RESIDENT COUNTS ACROSS ALL ENDPOINTS")
    print("=" * 80)
    
    # Test 1: Dashboard Stats
    print("\n1. Dashboard Stats (Super Admin)")
    print("-" * 80)
    try:
        response = requests.get(f"{BASE_URL}/super-admin/dashboard/stats")
        if response.status_code == 200:
            data = response.json()
            dashboard_residents = data.get('totalResidents', 0)
            print(f"✓ Total Residents from Dashboard: {dashboard_residents}")
        else:
            print(f"✗ Error: {response.status_code}")
            dashboard_residents = None
    except Exception as e:
        print(f"✗ Exception: {e}")
        dashboard_residents = None
    
    # Test 2: All Residents Endpoint
    print("\n2. All Residents Endpoint")
    print("-" * 80)
    try:
        response = requests.get(f"{BASE_URL}/super-admin/residents")
        if response.status_code == 200:
            data = response.json()
            all_residents_count = len(data) if isinstance(data, list) else 0
            print(f"✓ Total Residents from /residents: {all_residents_count}")
            
            # Show sample residents
            if data and len(data) > 0:
                print(f"\nSample residents (first 3):")
                for i, resident in enumerate(data[:3]):
                    print(f"  {i+1}. {resident.get('fullName')} - {resident.get('siteName')} - {resident.get('apartmentNumber')}")
        else:
            print(f"✗ Error: {response.status_code}")
            all_residents_count = None
    except Exception as e:
        print(f"✗ Exception: {e}")
        all_residents_count = None
    
    # Test 3: Messaging Apartments (Site 1)
    print("\n3. Messaging Apartments for Site 1")
    print("-" * 80)
    try:
        response = requests.get(f"{BASE_URL}/messages/apartments/1")
        if response.status_code == 200:
            data = response.json()
            messaging_residents = len([apt for apt in data if apt.get('residentId')]) if isinstance(data, list) else 0
            print(f"✓ Residents with apartments in Site 1: {messaging_residents}")
            
            # Show sample apartments
            if data and len(data) > 0:
                print(f"\nSample apartments with residents (first 3):")
                count = 0
                for apt in data:
                    if apt.get('residentId') and count < 3:
                        print(f"  {count+1}. {apt.get('number')} - {apt.get('residentName')}")
                        count += 1
        else:
            print(f"✗ Error: {response.status_code}")
            messaging_residents = None
    except Exception as e:
        print(f"✗ Exception: {e}")
        messaging_residents = None
    
    # Test 4: Database Direct Query
    print("\n4. Database Direct Query (user_site_memberships)")
    print("-" * 80)
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="root",
            database="site_yonetim"
        )
        cursor = conn.cursor()
        
        # Count residents from user_site_memberships
        cursor.execute("""
            SELECT COUNT(*) 
            FROM user_site_memberships 
            WHERE role_type = 'sakin' 
            AND is_deleted = FALSE 
            AND status = 'aktif'
        """)
        db_residents = cursor.fetchone()[0]
        print(f"✓ Total Residents from DB (user_site_memberships): {db_residents}")
        
        # Count residents with apartments
        cursor.execute("""
            SELECT COUNT(DISTINCT a.current_resident_id)
            FROM apartments a
            INNER JOIN user_site_memberships usm ON a.current_resident_id = usm.user_id
            WHERE a.current_resident_id IS NOT NULL
            AND usm.role_type = 'sakin'
            AND usm.is_deleted = FALSE
            AND usm.status = 'aktif'
        """)
        db_residents_with_apartments = cursor.fetchone()[0]
        print(f"✓ Residents with apartments from DB: {db_residents_with_apartments}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"✗ Exception: {e}")
        db_residents = None
        db_residents_with_apartments = None
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    counts = {
        "Dashboard Stats": dashboard_residents,
        "All Residents Endpoint": all_residents_count,
        "Messaging Apartments (Site 1)": messaging_residents,
        "Database (user_site_memberships)": db_residents,
        "Database (with apartments)": db_residents_with_apartments
    }
    
    for name, count in counts.items():
        if count is not None:
            print(f"{name:40s}: {count:5d}")
        else:
            print(f"{name:40s}: ERROR")
    
    # Check consistency
    print("\n" + "=" * 80)
    print("CONSISTENCY CHECK")
    print("=" * 80)
    
    valid_counts = [c for c in [dashboard_residents, all_residents_count, db_residents] if c is not None]
    
    if len(valid_counts) > 0 and len(set(valid_counts)) == 1:
        print(f"✓ ALL COUNTS ARE CONSISTENT: {valid_counts[0]} residents")
        print("✓ SUCCESS: The bug is fixed!")
    else:
        print(f"✗ COUNTS ARE INCONSISTENT!")
        print(f"  Dashboard: {dashboard_residents}")
        print(f"  Residents Endpoint: {all_residents_count}")
        print(f"  Database: {db_residents}")
        print("✗ FAILURE: The bug still exists!")
    
    print("\nNote: Messaging apartments count may be different because it only shows")
    print("      residents who have apartments assigned, not all residents.")

if __name__ == "__main__":
    test_resident_counts()
