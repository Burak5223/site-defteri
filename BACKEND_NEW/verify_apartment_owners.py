import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

print("\n=== CHECKING APARTMENTS WITH OWNERS AND RESIDENTS ===\n")

# Check apartments by block
cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(a.id) as total_apartments,
        SUM(CASE WHEN a.owner_user_id IS NOT NULL AND a.owner_user_id != '' THEN 1 ELSE 0 END) as apartments_with_owners,
        SUM(CASE WHEN a.current_resident_id IS NOT NULL AND a.current_resident_id != '' THEN 1 ELSE 0 END) as apartments_with_residents
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE a.site_id = '1' AND (a.is_deleted = 0 OR a.is_deleted IS NULL)
    GROUP BY b.name
    ORDER BY b.name
""")

results = cursor.fetchall()
for row in results:
    print(f"Block: {row[0]}")
    print(f"  Total Apartments: {row[1]}")
    print(f"  Apartments with Owners: {row[2]}")
    print(f"  Apartments with Residents: {row[3]}")
    print()

print("\n=== SAMPLE APARTMENTS FROM EACH BLOCK ===\n")

# Show sample apartments from each block
cursor.execute("""
    SELECT 
        b.name as block_name,
        a.unit_number,
        a.owner_user_id,
        a.current_resident_id,
        u1.full_name as owner_name,
        u2.full_name as resident_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users u1 ON a.owner_user_id = u1.id
    LEFT JOIN users u2 ON a.current_resident_id = u2.id
    WHERE a.site_id = '1' AND (a.is_deleted = 0 OR a.is_deleted IS NULL)
    ORDER BY b.name, a.unit_number
    LIMIT 10
""")

results = cursor.fetchall()
for row in results:
    print(f"Block: {row[0]}, Apartment: {row[1]}")
    print(f"  Owner ID: {row[2]}, Name: {row[4]}")
    print(f"  Resident ID: {row[3]}, Name: {row[5]}")
    print()

cursor.close()
conn.close()
