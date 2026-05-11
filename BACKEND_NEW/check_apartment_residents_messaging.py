#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Check apartment residents for messaging
"""

import mysql.connector
import json

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("APARTMENT RESIDENTS FOR MESSAGING CHECK")
print("=" * 80)

# Check A Blok apartments with residents
print("\n1. Checking A Blok apartments with owner/resident info:")
print("-" * 80)

query = """
SELECT 
    a.id,
    a.block_name,
    a.unit_number,
    a.floor,
    a.owner_user_id,
    owner.full_name as owner_name,
    owner.email as owner_email,
    a.current_resident_id,
    resident.full_name as resident_name,
    resident.email as resident_email,
    (SELECT COUNT(*) FROM user_site_memberships usm WHERE usm.user_id = a.owner_user_id AND usm.site_id = '1') as owner_is_member,
    (SELECT COUNT(*) FROM user_site_memberships usm WHERE usm.user_id = a.current_resident_id AND usm.site_id = '1') as resident_is_member
FROM apartments a
LEFT JOIN users owner ON a.owner_user_id = owner.id
LEFT JOIN users resident ON a.current_resident_id = resident.id
WHERE a.site_id = '1' 
  AND a.block_name = 'A Blok'
ORDER BY CAST(a.unit_number AS UNSIGNED)
LIMIT 10
"""

cursor.execute(query)
apartments = cursor.fetchall()

for apt in apartments:
    print(f"\n{apt['block_name']} {apt['unit_number']}:")
    print(f"  Apartment ID: {apt['id']}")
    
    if apt['owner_user_id']:
        print(f"  Owner: {apt['owner_name']} ({apt['owner_email']})")
        print(f"    - Is site member: {'YES' if apt['owner_is_member'] > 0 else 'NO'}")
    else:
        print(f"  Owner: NONE")
    
    if apt['current_resident_id']:
        print(f"  Resident: {apt['resident_name']} ({apt['resident_email']})")
        print(f"    - Is site member: {'YES' if apt['resident_is_member'] > 0 else 'NO'}")
    else:
        print(f"  Resident: NONE")

# Check residency_history
print("\n\n2. Checking residency_history for active residents:")
print("-" * 80)

query = """
SELECT 
    rh.id,
    rh.apartment_id,
    a.block_name,
    a.unit_number,
    rh.user_id,
    u.full_name,
    u.email,
    rh.residency_type,
    rh.status,
    rh.start_date,
    rh.end_date,
    (SELECT COUNT(*) FROM user_site_memberships usm WHERE usm.user_id = rh.user_id AND usm.site_id = '1') as is_site_member
FROM residency_history rh
JOIN apartments a ON rh.apartment_id = a.id
JOIN users u ON rh.user_id = u.id
WHERE a.site_id = '1'
  AND a.block_name = 'A Blok'
  AND rh.status = 'active'
ORDER BY a.block_name, CAST(a.unit_number AS UNSIGNED)
LIMIT 10
"""

cursor.execute(query)
residencies = cursor.fetchall()

if residencies:
    for res in residencies:
        print(f"\n{res['block_name']} {res['unit_number']}:")
        print(f"  User: {res['full_name']} ({res['email']})")
        print(f"  Type: {res['residency_type']}")
        print(f"  Status: {res['status']}")
        print(f"  Is site member: {'YES' if res['is_site_member'] > 0 else 'NO'}")
else:
    print("  No active residencies found!")

# Check user_site_memberships
print("\n\n3. Checking user_site_memberships for site 1:")
print("-" * 80)

query = """
SELECT 
    usm.user_id,
    u.full_name,
    u.email,
    usm.role,
    usm.status
FROM user_site_memberships usm
JOIN users u ON usm.user_id = u.id
WHERE usm.site_id = '1'
  AND u.email LIKE '%@site.com'
ORDER BY u.full_name
LIMIT 20
"""

cursor.execute(query)
memberships = cursor.fetchall()

print(f"\nFound {len(memberships)} site members:")
for member in memberships:
    print(f"  - {member['full_name']} ({member['email']}): {member['role']} - {member['status']}")

# Test API call simulation
print("\n\n4. Simulating getApartmentsForMessaging logic:")
print("-" * 80)

# Get site member IDs
cursor.execute("SELECT user_id FROM user_site_memberships WHERE site_id = '1'")
site_member_ids = [row['user_id'] for row in cursor.fetchall()]
print(f"\nSite member IDs count: {len(site_member_ids)}")

# Get apartments
cursor.execute("""
    SELECT 
        a.id,
        a.block_name,
        a.unit_number,
        a.floor,
        a.owner_user_id,
        a.current_resident_id,
        owner.full_name as owner_name,
        resident.full_name as resident_name
    FROM apartments a
    LEFT JOIN users owner ON a.owner_user_id = owner.id
    LEFT JOIN users resident ON a.current_resident_id = resident.id
    WHERE a.site_id = '1' AND a.block_name = 'A Blok'
    ORDER BY CAST(a.unit_number AS UNSIGNED)
    LIMIT 10
""")

apartments = cursor.fetchall()

print(f"\nProcessing {len(apartments)} apartments:\n")

for apt in apartments:
    resident_names = []
    
    # Check tenant
    if apt['current_resident_id'] and apt['current_resident_id'] in site_member_ids:
        resident_names.append(f"{apt['resident_name']} (Kiracı)")
    
    # Check owner
    if apt['owner_user_id'] and apt['owner_user_id'] in site_member_ids:
        resident_names.append(f"{apt['owner_name']} (Malik)")
    
    display_name = " • ".join(resident_names) if resident_names else "Boş Daire"
    
    print(f"{apt['block_name']} {apt['unit_number']}: {display_name}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("CHECK COMPLETED")
print("=" * 80)
