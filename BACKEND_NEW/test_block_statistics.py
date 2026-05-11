import mysql.connector
import json

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("BLOCK STATISTICS TEST")
print("=" * 80)

# Get all blocks for Site 1
cursor.execute("""
    SELECT id, name, site_id 
    FROM blocks 
    WHERE site_id = '1' AND (is_deleted = 0 OR is_deleted IS NULL)
    ORDER BY name
""")
blocks = cursor.fetchall()

print(f"\nFound {len(blocks)} blocks for Site 1\n")

for block in blocks:
    print(f"\n{'=' * 60}")
    print(f"BLOCK: {block['name']} (ID: {block['id']})")
    print(f"{'=' * 60}")
    
    # Get apartments in this block
    cursor.execute("""
        SELECT 
            id,
            unit_number,
            owner_user_id,
            current_resident_id
        FROM apartments 
        WHERE block_id = %s AND (is_deleted = 0 OR is_deleted IS NULL)
        ORDER BY unit_number
    """, (block['id'],))
    apartments = cursor.fetchall()
    
    print(f"Total Apartments: {len(apartments)}")
    
    # Count owners and tenants
    owner_count = 0
    tenant_count = 0
    
    for apt in apartments:
        if apt['owner_user_id']:
            owner_count += 1
        if apt['current_resident_id']:
            tenant_count += 1
    
    print(f"Owners (malik): {owner_count}")
    print(f"Tenants (kiracı): {tenant_count}")
    print(f"Total Residents: {owner_count + tenant_count}")
    
    # Show first 5 apartments as sample
    print(f"\nSample apartments (first 5):")
    for apt in apartments[:5]:
        owner_status = "✓" if apt['owner_user_id'] else "✗"
        tenant_status = "✓" if apt['current_resident_id'] else "✗"
        print(f"  Daire {apt['unit_number']}: Owner={owner_status}, Tenant={tenant_status}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)

cursor.close()
conn.close()
