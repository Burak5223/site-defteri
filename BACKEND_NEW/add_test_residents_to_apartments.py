#!/usr/bin/env python3
"""
Add test residents (Ali Doğan and Elif Kılıç) to apartments if Sakin User is not there
"""
import mysql.connector
import requests
import json
import uuid
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("ADDING TEST RESIDENTS TO APARTMENTS")
print("=" * 80)

# 1. Login as admin to get token
print("\n1. Logging in as admin...")
try:
    login_response = requests.post("http://localhost:8080/api/auth/login", 
                                 json={
                                     "email": "admin@site.com",
                                     "password": "admin123"
                                 })
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        token = login_data.get('accessToken')
        print(f"✅ Admin login successful")
        headers = {"Authorization": f"Bearer {token}"}
    else:
        print(f"❌ Admin login failed: {login_response.status_code}")
        exit(1)
        
except Exception as e:
    print(f"❌ Login failed: {e}")
    exit(1)

# 2. Check current residents in Daire 12 and 36
apartments_to_check = [
    {"block": "A Blok", "unit": "12"},
    {"block": "B Blok", "unit": "36"}
]

for apt_info in apartments_to_check:
    block_name = apt_info["block"]
    unit_number = apt_info["unit"]
    
    print(f"\n2. Checking {block_name} Daire {unit_number}...")
    
    # Get apartment ID
    cursor.execute("""
        SELECT a.id FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE b.name = %s AND a.unit_number = %s
        LIMIT 1
    """, (block_name, unit_number))
    
    apt_result = cursor.fetchone()
    if not apt_result:
        print(f"❌ {block_name} Daire {unit_number} not found")
        continue
        
    apartment_id = apt_result[0]
    print(f"✅ Found apartment ID: {apartment_id}")
    
    # Check current residents via API
    try:
        response = requests.get(f"http://localhost:8080/api/apartments/{apartment_id}/residents", headers=headers)
        
        if response.status_code == 200:
            residents = response.json()
            print(f"✅ Current residents: {len(residents)}")
            
            for resident in residents:
                print(f"   - {resident.get('fullName')} ({resident.get('email')})")
            
            # If no residents or only Sakin User, add test residents
            if len(residents) == 0:
                print(f"   No residents found, adding test residents...")
                
                # Create Ali Doğan for this apartment
                ali_email = f"ali.dogan.{unit_number}@yesilvadi.com"
                elif_email = f"elif.kilic.{unit_number}@yesilvadi.com"
                
                # Create Ali Doğan
                print(f"   Creating Ali Doğan ({ali_email})...")
                ali_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO users (id, full_name, email, phone, password_hash, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, 'aktif', NOW(), NOW())
                    ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)
                """, (ali_id, "Ali Doğan", ali_email, f"555123{unit_number}01", "$2a$10$dummy.hash.for.testing"))
                
                # Create Elif Kılıç
                print(f"   Creating Elif Kılıç ({elif_email})...")
                elif_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO users (id, full_name, email, phone, password_hash, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, 'aktif', NOW(), NOW())
                    ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)
                """, (elif_id, "Elif Kılıç", elif_email, f"555123{unit_number}02", "$2a$10$dummy.hash.for.testing"))
                
                # Add Ali as owner
                ali_residency_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO residency_history 
                    (id, apartment_id, user_id, is_owner, move_in_date, status, created_at, updated_at, is_deleted)
                    VALUES (%s, %s, %s, TRUE, %s, 'active', NOW(), NOW(), FALSE)
                """, (ali_residency_id, apartment_id, ali_id, datetime.now().date()))
                
                # Add Elif as tenant
                elif_residency_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO residency_history 
                    (id, apartment_id, user_id, is_owner, move_in_date, status, created_at, updated_at, is_deleted)
                    VALUES (%s, %s, %s, FALSE, %s, 'active', NOW(), NOW(), FALSE)
                """, (elif_residency_id, apartment_id, elif_id, datetime.now().date()))
                
                # Add site memberships
                ali_membership_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO user_site_memberships 
                    (id, user_id, site_id, role_type, user_type, status, joined_at, created_at, updated_at)
                    VALUES (%s, %s, '1', 'sakin', 'kat_maliki', 'aktif', %s, NOW(), NOW())
                """, (ali_membership_id, ali_id, datetime.now().date()))
                
                elif_membership_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO user_site_memberships 
                    (id, user_id, site_id, role_type, user_type, status, joined_at, created_at, updated_at)
                    VALUES (%s, %s, '1', 'sakin', 'kiraci', 'aktif', %s, NOW(), NOW())
                """, (elif_membership_id, elif_id, datetime.now().date()))
                
                conn.commit()
                print(f"   ✅ Added Ali Doğan (Owner) and Elif Kılıç (Tenant) to {block_name} Daire {unit_number}")
                
            elif len(residents) == 1 and residents[0].get('email') == 'sakin@site.com':
                print(f"   Only Sakin User found, this is correct!")
            else:
                print(f"   Apartment has residents, skipping...")
                
        else:
            print(f"❌ Failed to get residents: {response.status_code}")
            
    except Exception as e:
        print(f"❌ API request failed: {e}")

# 3. Verify the changes
print(f"\n3. Verifying residents after changes...")
for apt_info in apartments_to_check:
    block_name = apt_info["block"]
    unit_number = apt_info["unit"]
    
    print(f"\n   Checking {block_name} Daire {unit_number}...")
    
    # Get apartment ID
    cursor.execute("""
        SELECT a.id FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE b.name = %s AND a.unit_number = %s
        LIMIT 1
    """, (block_name, unit_number))
    
    apt_result = cursor.fetchone()
    if apt_result:
        apartment_id = apt_result[0]
        
        # Check via API
        try:
            response = requests.get(f"http://localhost:8080/api/apartments/{apartment_id}/residents", headers=headers)
            
            if response.status_code == 200:
                residents = response.json()
                print(f"   ✅ Final residents count: {len(residents)}")
                
                for resident in residents:
                    print(f"     - {resident.get('fullName')} ({resident.get('email')}) - {resident.get('residentType')}")
            else:
                print(f"   ❌ Failed to verify: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Verification failed: {e}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("TEST RESIDENTS ADDITION COMPLETED")
print("=" * 80)