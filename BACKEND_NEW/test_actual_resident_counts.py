import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== TESTING ACTUAL RESIDENT COUNTS ===\n")

# Get all apartments for site 1
cursor.execute("""
    SELECT 
        a.id,
        a.block_name,
        a.unit_number,
        a.owner_user_id,
        a.current_resident_id,
        CASE 
            WHEN a.owner_user_id IS NOT NULL AND a.current_resident_id IS NOT NULL 
                 AND a.owner_user_id != a.current_resident_id THEN 2
            WHEN a.owner_user_id IS NOT NULL OR a.current_resident_id IS NOT NULL THEN 1
            ELSE 0
        END as resident_count
    FROM apartments a
    WHERE a.site_id = '1'
    ORDER BY a.block_name, CAST(a.unit_number AS UNSIGNED)
""")

apartments = cursor.fetchall()

print(f"Total apartments: {len(apartments)}")

# Count by resident count
count_0 = sum(1 for apt in apartments if apt['resident_count'] == 0)
count_1 = sum(1 for apt in apartments if apt['resident_count'] == 1)
count_2 = sum(1 for apt in apartments if apt['resident_count'] == 2)

print(f"Apartments with 0 residents: {count_0}")
print(f"Apartments with 1 resident: {count_1}")
print(f"Apartments with 2 residents: {count_2}")

# Total residents
total_residents = sum(apt['resident_count'] for apt in apartments)
print(f"\nTotal residents: {total_residents}")

# Group by block
blocks = {}
for apt in apartments:
    block = apt['block_name']
    if block not in blocks:
        blocks[block] = {'apartments': 0, 'residents': 0}
    blocks[block]['apartments'] += 1
    blocks[block]['residents'] += apt['resident_count']

print("\n=== BY BLOCK ===")
for block_name in sorted(blocks.keys()):
    block_data = blocks[block_name]
    print(f"{block_name}: {block_data['apartments']} daire • {block_data['residents']} sakin")

print("\n=== SAMPLE APARTMENTS ===")
for apt in apartments[:10]:
    print(f"{apt['block_name']} {apt['unit_number']}: {apt['resident_count']} sakin (owner: {apt['owner_user_id'] is not None}, resident: {apt['current_resident_id'] is not None})")

cursor.close()
conn.close()

print("\n✓ Test completed!")
