#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix apartments owner_user_id and current_resident_id from residency_history
"""

import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("FIX APARTMENTS FROM RESIDENCY_HISTORY")
print("=" * 80)

# Check current state
print("\n1. Current state:")
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

# Get active residencies
print("\n2. Getting active residencies from residency_history...")
cursor.execute("""
    SELECT 
        apartment_id,
        user_id,
        type,
        status
    FROM residency_history
    WHERE status = 'active'
    ORDER BY apartment_id, type
""")

residencies = cursor.fetchall()
print(f"   Found {len(residencies)} active residencies")

# Group by apartment
apartments_map = {}
for res in residencies:
    apt_id = res['apartment_id']
    user_id = res['user_id']
    res_type = res['type']
    
    if apt_id not in apartments_map:
        apartments_map[apt_id] = {
            'owners': [],
            'tenants': []
        }
    
    if res_type == 'owner':
        apartments_map[apt_id]['owners'].append(user_id)
    elif res_type == 'tenant':
        apartments_map[apt_id]['tenants'].append(user_id)

print(f"   Grouped into {len(apartments_map)} apartments")

# Update apartments
print("\n3. Updating apartments...")
updated_count = 0

for apt_id, data in apartments_map.items():
    owners = data['owners']
    tenants = data['tenants']
    
    # Set owner_user_id (first owner)
    owner_id = owners[0] if owners else None
    
    # Set current_resident_id (first tenant, or owner if no tenant)
    if tenants:
        resident_id = tenants[0]
    elif owners:
        resident_id = owners[0]
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
print("\n4. After update:")
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

# Show sample apartments
print("\n5. Sample apartments (A Blok 1-5):")
cursor.execute("""
    SELECT 
        a.block_name,
        a.unit_number,
        owner.full_name as owner_name,
        resident.full_name as resident_name
    FROM apartments a
    LEFT JOIN users owner ON a.owner_user_id = owner.id
    LEFT JOIN users resident ON a.current_resident_id = resident.id
    WHERE a.site_id = '1' AND a.block_name = 'A Blok'
    ORDER BY CAST(a.unit_number AS UNSIGNED)
    LIMIT 5
""")

samples = cursor.fetchall()
for apt in samples:
    print(f"   {apt['block_name']} {apt['unit_number']}: Owner={apt['owner_name']}, Resident={apt['resident_name']}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("✅ FIX COMPLETED")
print("=" * 80)
