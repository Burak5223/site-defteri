#!/usr/bin/env python3
"""
Rebalance owner/tenant to 50/50 split
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
print("REBALANCING OWNER/TENANT TO 50/50")
print("=" * 80)
print()

# 1. Current distribution
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
total = 0
owners = 0
tenants = 0
for row in current:
    print(f"  {row['type']}: {row['count']}")
    total += row['count']
    if 'Maliki' in row['type']:
        owners = row['count']
    else:
        tenants = row['count']
print(f"  Total: {total}")
print()

# Target: 48 owners, 49 tenants (approximately 50/50)
target_owners = 48
target_tenants = total - target_owners

print(f"2. TARGET DISTRIBUTION:")
print("-" * 80)
print(f"  Target Owners: {target_owners}")
print(f"  Target Tenants: {target_tenants}")
print()

# Convert some owners to tenants
if owners > target_owners:
    to_convert = owners - target_owners
    print(f"3. CONVERTING {to_convert} OWNERS TO TENANTS:")
    print("-" * 80)
    
    # Get random owners
    cursor.execute("""
        SELECT rh.id, rh.user_id, u.full_name, a.block_name, a.unit_number
        FROM residency_history rh
        JOIN users u ON rh.user_id = u.id
        JOIN apartments a ON rh.apartment_id = a.id
        WHERE rh.status = 'active'
        AND a.site_id = '1'
        AND rh.is_owner = 1
        ORDER BY RAND()
        LIMIT %s
    """, (to_convert,))
    owners_to_convert = cursor.fetchall()
    
    converted = 0
    for owner in owners_to_convert:
        cursor.execute("""
            UPDATE residency_history
            SET is_owner = 0
            WHERE id = %s
        """, (owner['id'],))
        converted += 1
        if converted <= 5:
            print(f"  ✓ {owner['full_name']} ({owner['block_name']} - {owner['unit_number']}) → Kiracı")
    
    if converted > 5:
        print(f"  ... and {converted - 5} more")
    
    conn.commit()
    print()

# Convert some tenants to owners
elif tenants > target_tenants:
    to_convert = tenants - target_tenants
    print(f"3. CONVERTING {to_convert} TENANTS TO OWNERS:")
    print("-" * 80)
    
    # Get random tenants
    cursor.execute("""
        SELECT rh.id, rh.user_id, u.full_name, a.block_name, a.unit_number
        FROM residency_history rh
        JOIN users u ON rh.user_id = u.id
        JOIN apartments a ON rh.apartment_id = a.id
        WHERE rh.status = 'active'
        AND a.site_id = '1'
        AND rh.is_owner = 0
        ORDER BY RAND()
        LIMIT %s
    """, (to_convert,))
    tenants_to_convert = cursor.fetchall()
    
    converted = 0
    for tenant in tenants_to_convert:
        cursor.execute("""
            UPDATE residency_history
            SET is_owner = 1
            WHERE id = %s
        """, (tenant['id'],))
        converted += 1
        if converted <= 5:
            print(f"  ✓ {tenant['full_name']} ({tenant['block_name']} - {tenant['unit_number']}) → Kat Maliki")
    
    if converted > 5:
        print(f"  ... and {converted - 5} more")
    
    conn.commit()
    print()

# 4. Final distribution
print("4. FINAL DISTRIBUTION:")
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
final = cursor.fetchall()
for row in final:
    percentage = (row['count'] / total) * 100
    print(f"  {row['type']}: {row['count']} ({percentage:.1f}%)")
print()

# 5. Distribution by block
print("5. DISTRIBUTION BY BLOCK:")
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
print("✅ DONE! Distribution is now balanced ~50/50")
print("=" * 80)
