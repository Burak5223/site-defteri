#!/usr/bin/env python3
"""
Verify that the 97 residents are properly set up and will appear in the residents endpoint
"""

import mysql.connector
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("RESIDENTS ENDPOINT VERIFICATION")
print("=" * 80)
print()

# 1. Check users with site memberships
print("1. USERS WITH SITE MEMBERSHIPS (role_type='sakin'):")
print("-" * 80)
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        usm.site_id,
        s.name as site_name,
        usm.role_type,
        usm.status
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    JOIN sites s ON usm.site_id = s.id
    WHERE usm.role_type = 'sakin' 
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
    ORDER BY u.full_name
""")
members = cursor.fetchall()
print(f"Total site members with role 'sakin': {len(members)}")
if members:
    print(f"\nFirst 5 members:")
    for i, member in enumerate(members[:5], 1):
        print(f"  {i}. {member['full_name']} - {member['email']}")
        print(f"     Site: {member['site_name']} (ID: {member['site_id']})")
        print(f"     Role: {member['role_type']}, Status: {member['status']}")
print()

# 2. Check users with apartments (via residency_history)
print("2. USERS WITH APARTMENTS (via residency_history):")
print("-" * 80)
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        a.id as apartment_id,
        a.block_name,
        a.unit_number,
        a.site_id,
        s.name as site_name,
        CASE WHEN rh.is_owner = 1 THEN 'kat_maliki' ELSE 'kiraci' END as residency_type,
        rh.status
    FROM users u
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN sites s ON a.site_id = s.id
    WHERE rh.status = 'active'
    ORDER BY a.block_name, a.unit_number
""")
residents = cursor.fetchall()
print(f"Total users with active residency: {len(residents)}")
if residents:
    print(f"\nFirst 5 residents:")
    for i, resident in enumerate(residents[:5], 1):
        print(f"  {i}. {resident['full_name']} - {resident['email']}")
        print(f"     Apartment: {resident['block_name']} - {resident['unit_number']}")
        print(f"     Site: {resident['site_name']} (ID: {resident['site_id']})")
        print(f"     Type: {resident['residency_type']}, Status: {resident['status']}")
print()

# 3. Check block distribution
print("3. BLOCK DISTRIBUTION:")
print("-" * 80)
cursor.execute("""
    SELECT 
        a.block_name,
        COUNT(DISTINCT rh.user_id) as resident_count
    FROM apartments a
    JOIN residency_history rh ON a.id = rh.apartment_id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
    GROUP BY a.block_name
    ORDER BY a.block_name
""")
blocks = cursor.fetchall()
for block in blocks:
    print(f"  {block['block_name']}: {block['resident_count']} residents")
print()

# 4. Check residency type distribution
print("4. RESIDENCY TYPE DISTRIBUTION:")
print("-" * 80)
cursor.execute("""
    SELECT 
        CASE WHEN rh.is_owner = 1 THEN 'kat_maliki' ELSE 'kiraci' END as residency_type,
        COUNT(*) as count
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
    GROUP BY rh.is_owner
""")
types = cursor.fetchall()
for type_row in types:
    print(f"  {type_row['residency_type']}: {type_row['count']} users")
print()

# 5. Verify all 97 users have both site membership AND apartment
print("5. USERS WITH BOTH SITE MEMBERSHIP AND APARTMENT:")
print("-" * 80)
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        usm.site_id as membership_site_id,
        a.site_id as apartment_site_id,
        a.block_name,
        a.unit_number,
        CASE WHEN rh.is_owner = 1 THEN 'kat_maliki' ELSE 'kiraci' END as residency_type
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND rh.status = 'active'
    AND usm.site_id = '1'
    AND a.site_id = '1'
    ORDER BY u.full_name
""")
complete_residents = cursor.fetchall()
print(f"Total users with BOTH site membership AND apartment: {len(complete_residents)}")
print()

# 6. Check for any users missing either membership or apartment
print("6. DATA INTEGRITY CHECK:")
print("-" * 80)

# Users with membership but no apartment
cursor.execute("""
    SELECT u.id, u.full_name, u.email
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.role_type = 'sakin' AND usm.site_id = '1'
    AND NOT EXISTS (
        SELECT 1 FROM residency_history rh
        JOIN apartments a ON rh.apartment_id = a.id
        WHERE rh.user_id = u.id AND rh.status = 'active' AND a.site_id = '1'
    )
""")
no_apartment = cursor.fetchall()
print(f"Users with site membership but NO apartment: {len(no_apartment)}")
if no_apartment:
    for user in no_apartment[:5]:
        print(f"  - {user['full_name']} ({user['email']})")

# Users with apartment but no membership
cursor.execute("""
    SELECT u.id, u.full_name, u.email
    FROM users u
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active' AND a.site_id = '1'
    AND NOT EXISTS (
        SELECT 1 FROM user_site_memberships usm
        WHERE usm.user_id = u.id AND usm.site_id = '1' AND usm.role_type = 'sakin'
    )
""")
no_membership = cursor.fetchall()
print(f"Users with apartment but NO site membership: {len(no_membership)}")
if no_membership:
    for user in no_membership[:5]:
        print(f"  - {user['full_name']} ({user['email']})")
print()

# 7. Summary
print("=" * 80)
print("SUMMARY:")
print("=" * 80)
print(f"✓ Site members (role='sakin'): {len(members)}")
print(f"✓ Users with apartments: {len(residents)}")
print(f"✓ Users with BOTH: {len(complete_residents)}")
print()
if len(complete_residents) == 97:
    print("✅ SUCCESS! All 97 residents are properly configured!")
    print("   They have both site membership AND apartment assignment.")
    print("   They should appear in the residents endpoint.")
else:
    print(f"⚠️  WARNING! Expected 97 complete residents, found {len(complete_residents)}")
    print("   Some users may be missing site membership or apartment assignment.")
print()

cursor.close()
conn.close()
