#!/usr/bin/env python3
"""
Fix owner/tenant distribution - make it more balanced
Change some tenants to owners to have ~50/50 distribution
"""

import mysql.connector
import random

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("FIXING OWNER/TENANT DISTRIBUTION")
print("=" * 80)
print()

# 1. Check current distribution
print("1. CURRENT DISTRIBUTION:")
print("-" * 80)
cursor.execute("""
    SELECT 
        CASE WHEN is_owner = 1 THEN 'Kat Maliki' ELSE 'Kiracı' END as type,
        COUNT(*) as count
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
    GROUP BY rh.is_owner
""")
current = cursor.fetchall()
for row in current:
    print(f"  {row['type']}: {row['count']}")
print()

# 2. Get all tenants (is_owner = 0)
cursor.execute("""
    SELECT rh.id, rh.user_id, u.full_name, a.block_name, a.unit_number
    FROM residency_history rh
    JOIN users u ON rh.user_id = u.id
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
    AND rh.is_owner = 0
    ORDER BY RAND()
""")
tenants = cursor.fetchall()

print(f"2. CONVERTING TENANTS TO OWNERS:")
print("-" * 80)
print(f"Total tenants: {len(tenants)}")

# Convert half of the tenants to owners (to get ~50/50 split)
# We want approximately 48-49 owners out of 97
target_owners = 48
current_owners = 3  # We know we have 3 owners currently
tenants_to_convert = target_owners - current_owners

print(f"Target owners: {target_owners}")
print(f"Current owners: {current_owners}")
print(f"Tenants to convert: {tenants_to_convert}")
print()

# Convert random tenants to owners
converted = 0
for tenant in tenants[:tenants_to_convert]:
    cursor.execute("""
        UPDATE residency_history
        SET is_owner = 1
        WHERE id = %s
    """, (tenant['id'],))
    converted += 1
    if converted <= 5:  # Show first 5
        print(f"  ✓ {tenant['full_name']} ({tenant['block_name']} - {tenant['unit_number']}) → Kat Maliki")

if converted > 5:
    print(f"  ... and {converted - 5} more")

conn.commit()
print()

# 3. Verify new distribution
print("3. NEW DISTRIBUTION:")
print("-" * 80)
cursor.execute("""
    SELECT 
        CASE WHEN is_owner = 1 THEN 'Kat Maliki' ELSE 'Kiracı' END as type,
        COUNT(*) as count
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
    GROUP BY rh.is_owner
""")
new_dist = cursor.fetchall()
for row in new_dist:
    print(f"  {row['type']}: {row['count']}")
print()

# 4. Distribution by block
print("4. DISTRIBUTION BY BLOCK:")
print("-" * 80)
cursor.execute("""
    SELECT 
        a.block_name,
        SUM(CASE WHEN rh.is_owner = 1 THEN 1 ELSE 0 END) as owners,
        SUM(CASE WHEN rh.is_owner = 0 THEN 1 ELSE 0 END) as tenants,
        COUNT(*) as total
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
    GROUP BY a.block_name
    ORDER BY a.block_name
""")
blocks = cursor.fetchall()
for block in blocks:
    print(f"  {block['block_name']}: {block['owners']} malik, {block['tenants']} kiracı (total: {block['total']})")
print()

cursor.close()
conn.close()

print("=" * 80)
print("✅ DONE! Owner/Tenant distribution is now balanced")
print("=" * 80)
