#!/usr/bin/env python3
"""
Check sakinuser issue in residents page
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
print("CHECKING SAKINUSER ISSUE")
print("=" * 80)

# 1. Check if sakinuser exists in database
print("\n1. Checking if sakinuser exists in database...")
cursor.execute("""
    SELECT id, full_name, email, status
    FROM users 
    WHERE email LIKE '%sakinuser%' OR full_name LIKE '%sakinuser%'
""")

sakinuser_results = cursor.fetchall()
if sakinuser_results:
    print(f"✅ Found {len(sakinuser_results)} sakinuser(s) in database:")
    for user in sakinuser_results:
        user_id, name, email, status = user
        print(f"   - {name} ({email}) - Status: {status}")
        print(f"     User ID: {user_id}")
else:
    print("❌ No sakinuser found in database")

# 2. Check all users with 'sakin' in name or email
print("\n2. Checking all users with 'sakin' in name or email...")
cursor.execute("""
    SELECT id, full_name, email, status
    FROM users 
    WHERE email LIKE '%sakin%' OR full_name LIKE '%sakin%'
    ORDER BY full_name
""")

sakin_users = cursor.fetchall()
if sakin_users:
    print(f"✅ Found {len(sakin_users)} user(s) with 'sakin':")
    for user in sakin_users:
        user_id, name, email, status = user
        print(f"   - {name} ({email}) - Status: {status}")
        print(f"     User ID: {user_id}")
else:
    print("❌ No users with 'sakin' found")

# 3. Check residency for sakin users
print("\n3. Checking residency for sakin users...")
for user in sakin_users:
    user_id, name, email, status = user
    print(f"\n   Checking residency for {name} ({email}):")
    
    cursor.execute("""
        SELECT b.name, a.unit_number, rh.is_owner, rh.status
        FROM residency_history rh
        JOIN apartments a ON rh.apartment_id = a.id
        JOIN blocks b ON a.block_id = b.id
        WHERE rh.user_id = %s AND rh.is_deleted = FALSE
        ORDER BY rh.status DESC, b.name, a.unit_number
    """, (user_id,))
    
    residencies = cursor.fetchall()
    if residencies:
        for res in residencies:
            block, unit, is_owner, status = res
            role_type = "Malik" if is_owner else "Kiracı"
            print(f"     - {block} - {unit} ({role_type}) - Status: {status}")
    else:
        print(f"     ❌ No residency found for {name}")

# 4. Test API endpoint for residents
print("\n4. Testing API endpoint for residents...")
try:
    # Test with admin token (you might need to adjust this)
    response = requests.get("http://localhost:8080/api/admin/residents", 
                          headers={"Authorization": "Bearer admin_token_here"})
    
    if response.status_code == 200:
        residents_data = response.json()
        print(f"✅ API returned {len(residents_data)} residents")
        
        # Look for sakin users in API response
        sakin_in_api = [r for r in residents_data if 'sakin' in r.get('fullName', '').lower() or 'sakin' in r.get('email', '').lower()]
        if sakin_in_api:
            print(f"✅ Found {len(sakin_in_api)} sakin user(s) in API response:")
            for user in sakin_in_api:
                print(f"   - {user.get('fullName')} ({user.get('email')})")
        else:
            print("❌ No sakin users found in API response")
    else:
        print(f"❌ API request failed with status: {response.status_code}")
        
except Exception as e:
    print(f"❌ API request failed: {e}")

# 5. Check specific apartment residents
print("\n5. Checking residents in specific apartments...")
cursor.execute("""
    SELECT DISTINCT a.id, b.name, a.unit_number,
           COUNT(rh.user_id) as resident_count
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id 
                                   AND rh.status = 'active' 
                                   AND rh.is_deleted = FALSE
    WHERE b.site_id = 1
    GROUP BY a.id, b.name, a.unit_number
    HAVING resident_count > 0
    ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
    LIMIT 10
""")

apartments_with_residents = cursor.fetchall()
print(f"✅ Found {len(apartments_with_residents)} apartments with residents:")
for apt in apartments_with_residents:
    apt_id, block, unit, count = apt
    print(f"   - {block} - {unit}: {count} resident(s)")
    
    # Get resident details for this apartment
    cursor.execute("""
        SELECT u.full_name, u.email, rh.is_owner
        FROM residency_history rh
        JOIN users u ON rh.user_id = u.id
        WHERE rh.apartment_id = %s AND rh.status = 'active' AND rh.is_deleted = FALSE
    """, (apt_id,))
    
    residents = cursor.fetchall()
    for res in residents:
        name, email, is_owner = res
        role = "Malik" if is_owner else "Kiracı"
        print(f"     * {name} ({email}) - {role}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("SAKINUSER CHECK COMPLETED")
print("=" * 80)