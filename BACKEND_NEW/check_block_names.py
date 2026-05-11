#!/usr/bin/env python3
"""
Check block names in database
"""

import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("BLOCK NAMES CHECK")
print("=" * 80)
print()

# Check blocks table
print("1. BLOCKS TABLE:")
print("-" * 80)
cursor.execute("""
    SELECT id, name, site_id
    FROM blocks
    WHERE site_id = '1'
    ORDER BY name
""")
blocks = cursor.fetchall()
print(f"Total blocks: {len(blocks)}")
for block in blocks:
    print(f"  - {block['name']} (ID: {block['id']})")
print()

# Check apartments table - block_name field
print("2. APARTMENTS TABLE - block_name field:")
print("-" * 80)
cursor.execute("""
    SELECT DISTINCT block_name, COUNT(*) as count
    FROM apartments
    WHERE site_id = '1'
    GROUP BY block_name
    ORDER BY block_name
""")
apartment_blocks = cursor.fetchall()
print(f"Distinct block names in apartments: {len(apartment_blocks)}")
for block in apartment_blocks:
    print(f"  - '{block['block_name']}': {block['count']} apartments")
print()

# Check if there are apartments with wrong block names
print("3. APARTMENTS WITH MISMATCHED BLOCK NAMES:")
print("-" * 80)
cursor.execute("""
    SELECT a.id, a.block_name, a.unit_number
    FROM apartments a
    WHERE a.site_id = '1'
    AND a.block_name NOT IN ('A Blok', 'B Blok', 'C Blok')
    ORDER BY a.block_name, a.unit_number
    LIMIT 10
""")
wrong_blocks = cursor.fetchall()
if wrong_blocks:
    print(f"Found {len(wrong_blocks)} apartments with wrong block names:")
    for apt in wrong_blocks:
        print(f"  - Apartment {apt['unit_number']}: block_name = '{apt['block_name']}'")
else:
    print("✓ All apartments have correct block names")
print()

# Check residents with block names
print("4. RESIDENTS WITH BLOCK NAMES (from /api/users response):")
print("-" * 80)
cursor.execute("""
    SELECT 
        u.full_name,
        a.block_name,
        a.unit_number
    FROM users u
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.status = 'active'
    AND a.site_id = '1'
    ORDER BY a.block_name, a.unit_number
    LIMIT 10
""")
residents = cursor.fetchall()
print(f"Sample residents (first 10):")
for resident in residents:
    print(f"  - {resident['full_name']:25} | {resident['block_name']:10} - {resident['unit_number']}")
print()

cursor.close()
conn.close()

print("=" * 80)
print("SUMMARY")
print("=" * 80)
print("Check if all block names are consistent:")
print("- Blocks table should have: A, B, C")
print("- Apartments should have: A Blok, B Blok, C Blok")
print("=" * 80)
