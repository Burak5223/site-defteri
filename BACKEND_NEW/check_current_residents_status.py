#!/usr/bin/env python3
"""
Check current residents status in all apartments
"""
import mysql.connector
import requests
import json

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("CHECKING CURRENT RESIDENTS STATUS")
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

# 2. Get all apartments with residents
print(f"\n2. Checking all apartments with residents...")
cursor.execute("""
    SELECT DISTINCT a.id, b.name, a.unit_number, COUNT(rh.user_id) as resident_count
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id 
                                   AND rh.status = 'active' 
                                   AND rh.is_deleted = FALSE
    WHERE b.site_id = 1
    GROUP BY a.id, b.name, a.unit_number
    HAVING resident_count > 0
    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
""")

apartments_with_residents = cursor.fetchall()
print(f"✅ Found {len(apartments_with_residents)} apartments with residents:")

for apt in apartments_with_residents:
    apt_id, block, unit, count = apt
    print(f"\n   📍 {block} - Daire {unit} ({count} sakin):")
    
    # Get residents via API
    try:
        response = requests.get(f"http://localhost:8080/api/apartments/{apt_id}/residents", headers=headers)
        
        if response.status_code == 200:
            residents = response.json()
            
            for resident in residents:
                name = resident.get('fullName')
                email = resident.get('email')
                resident_type = resident.get('residentType')
                phone = resident.get('phone')
                
                role_emoji = "👑" if resident_type == "owner" else "🏠"
                role_text = "Malik" if resident_type == "owner" else "Kiracı"
                
                print(f"     {role_emoji} {name} ({email}) - {role_text}")
                if phone:
                    print(f"        📞 {phone}")
        else:
            print(f"     ❌ API failed: {response.status_code}")
            
    except Exception as e:
        print(f"     ❌ API error: {e}")

# 3. Check specific apartments (Daire 12 and 36)
print(f"\n3. Detailed check for Daire 12 and 36...")

specific_apartments = [
    {"block": "A Blok", "unit": "12"},
    {"block": "B Blok", "unit": "36"}
]

for apt_info in specific_apartments:
    block_name = apt_info["block"]
    unit_number = apt_info["unit"]
    
    print(f"\n   🔍 {block_name} Daire {unit_number}:")
    
    # Get apartment ID and residents from database
    cursor.execute("""
        SELECT a.id, u.full_name, u.email, u.phone, rh.is_owner, rh.status
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        LEFT JOIN residency_history rh ON a.id = rh.apartment_id 
                                       AND rh.status = 'active' 
                                       AND rh.is_deleted = FALSE
        LEFT JOIN users u ON rh.user_id = u.id
        WHERE b.name = %s AND a.unit_number = %s
    """, (block_name, unit_number))
    
    results = cursor.fetchall()
    
    if results:
        apartment_id = results[0][0]
        print(f"     Apartment ID: {apartment_id}")
        
        residents_found = False
        for result in results:
            apt_id, name, email, phone, is_owner, status = result
            if name:  # If there's a resident
                residents_found = True
                role = "Malik" if is_owner else "Kiracı"
                role_emoji = "👑" if is_owner else "🏠"
                print(f"     {role_emoji} {name} ({email}) - {role}")
                if phone:
                    print(f"        📞 {phone}")
        
        if not residents_found:
            print(f"     ❌ No residents found")
    else:
        print(f"     ❌ Apartment not found")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("CURRENT RESIDENTS STATUS CHECK COMPLETED")
print("=" * 80)