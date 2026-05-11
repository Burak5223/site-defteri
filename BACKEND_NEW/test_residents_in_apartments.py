#!/usr/bin/env python3
"""
Test residents in apartments - check why sakin@site.com doesn't appear in residents page
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
print("TESTING RESIDENTS IN APARTMENTS")
print("=" * 80)

# 1. Check sakin@site.com user details
print("\n1. Checking sakin@site.com user details...")
cursor.execute("""
    SELECT u.id, u.full_name, u.email, u.status
    FROM users u
    WHERE u.email = 'sakin@site.com'
""")

sakin_user = cursor.fetchone()
if not sakin_user:
    print("❌ sakin@site.com user not found!")
    cursor.close()
    conn.close()
    exit(1)

sakin_id, sakin_name, sakin_email, sakin_status = sakin_user
print(f"✅ Found user: {sakin_name} ({sakin_email}) - Status: {sakin_status}")
print(f"   User ID: {sakin_id}")

# 2. Check user's site memberships
print(f"\n2. Checking {sakin_name}'s site memberships...")
cursor.execute("""
    SELECT s.name, usm.role_type, usm.user_type, usm.status
    FROM user_site_memberships usm
    JOIN sites s ON usm.site_id = s.id
    WHERE usm.user_id = %s
""", (sakin_id,))

memberships = cursor.fetchall()
if memberships:
    print(f"✅ Found {len(memberships)} site membership(s):")
    for membership in memberships:
        site_name, role_type, user_type, status = membership
        print(f"   - Site: {site_name}")
        print(f"     Role: {role_type}, Type: {user_type}, Status: {status}")
else:
    print("❌ No site memberships found!")

# 3. Check user's apartments
print(f"\n3. Checking {sakin_name}'s apartments...")
cursor.execute("""
    SELECT b.name, a.unit_number, rh.is_owner, rh.status, s.name as site_name
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    JOIN sites s ON b.site_id = s.id
    WHERE rh.user_id = %s AND rh.is_deleted = FALSE
    ORDER BY rh.status DESC, b.name, a.unit_number
""", (sakin_id,))

apartments = cursor.fetchall()
if apartments:
    print(f"✅ Found {len(apartments)} apartment(s):")
    for apt in apartments:
        block, unit, is_owner, status, site_name = apt
        role = "Malik" if is_owner else "Kiracı"
        print(f"   - {site_name}: {block} - {unit} ({role}) - Status: {status}")
else:
    print("❌ No apartments found!")

# 4. Check what the residents API should return
print(f"\n4. Checking what residents API should return for Site 1...")
cursor.execute("""
    SELECT DISTINCT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        GROUP_CONCAT(DISTINCT CONCAT(b.name, ' - ', a.unit_number) ORDER BY b.name, a.unit_number SEPARATOR ', ') as apartments,
        GROUP_CONCAT(DISTINCT CASE WHEN rh.is_owner THEN 'Malik' ELSE 'Kiracı' END SEPARATOR ', ') as roles
    FROM users u
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = 1 
      AND rh.status = 'active' 
      AND rh.is_deleted = FALSE
      AND u.is_deleted = FALSE
    GROUP BY u.id, u.full_name, u.email, u.phone
    ORDER BY u.full_name
""")

residents_data = cursor.fetchall()
print(f"✅ Found {len(residents_data)} resident(s) for Site 1:")
for resident in residents_data:
    user_id, name, email, phone, apartments_str, roles_str = resident
    print(f"   - {name} ({email})")
    print(f"     Phone: {phone}")
    print(f"     Apartments: {apartments_str}")
    print(f"     Roles: {roles_str}")
    print(f"     User ID: {user_id}")
    print()

# 5. Check if sakin@site.com is in the results
sakin_in_results = any(resident[2] == 'sakin@site.com' for resident in residents_data)
if sakin_in_results:
    print("✅ sakin@site.com IS in the residents query results")
else:
    print("❌ sakin@site.com is NOT in the residents query results")

# 6. Check backend service method
print(f"\n6. Checking backend UserService.getAllResidents() logic...")
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.status as user_status,
        rh.status as residency_status,
        rh.is_deleted as residency_deleted,
        u.is_deleted as user_deleted,
        b.site_id
    FROM users u
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE u.email = 'sakin@site.com'
""")

sakin_details = cursor.fetchall()
if sakin_details:
    print(f"✅ Found {len(sakin_details)} record(s) for sakin@site.com:")
    for detail in sakin_details:
        user_id, name, email, phone, user_status, residency_status, residency_deleted, user_deleted, site_id = detail
        print(f"   - User Status: {user_status}")
        print(f"   - Residency Status: {residency_status}")
        print(f"   - Residency Deleted: {residency_deleted}")
        print(f"   - User Deleted: {user_deleted}")
        print(f"   - Site ID: {site_id}")
        
        # Check if this record should be included
        should_include = (
            user_status == 'aktif' and
            residency_status == 'active' and
            not residency_deleted and
            not user_deleted and
            site_id == 1
        )
        print(f"   - Should be included in residents: {should_include}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("RESIDENTS TEST COMPLETED")
print("=" * 80)