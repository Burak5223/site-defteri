import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("CORRECTED BLOCK STATISTICS TEST")
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

total_owners = 0
total_tenants = 0
total_residents = 0

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
    
    # Count owners and tenants CORRECTLY
    owner_count = 0
    tenant_count = 0
    resident_count = 0
    
    owner_occupied = 0
    tenant_occupied = 0
    empty = 0
    
    for apt in apartments:
        has_owner = apt['owner_user_id'] is not None and apt['owner_user_id'] != ''
        has_current = apt['current_resident_id'] is not None and apt['current_resident_id'] != ''
        
        if has_owner:
            owner_count += 1
            resident_count += 1
        
        # Tenant is only counted if current resident is different from owner
        if has_current and (not has_owner or apt['current_resident_id'] != apt['owner_user_id']):
            tenant_count += 1
            resident_count += 1
        
        # Classification
        if has_owner and has_current and apt['owner_user_id'] == apt['current_resident_id']:
            owner_occupied += 1
        elif has_current and (not has_owner or apt['current_resident_id'] != apt['owner_user_id']):
            tenant_occupied += 1
        elif not has_current:
            empty += 1
    
    print(f"\nStatistics:")
    print(f"  Owners (malik): {owner_count}")
    print(f"  Tenants (kiracı): {tenant_count}")
    print(f"  Total Residents: {resident_count}")
    print(f"\nOccupancy:")
    print(f"  Owner-occupied: {owner_occupied}")
    print(f"  Tenant-occupied: {tenant_occupied}")
    print(f"  Empty: {empty}")
    
    total_owners += owner_count
    total_tenants += tenant_count
    total_residents += resident_count
    
    # Show sample apartments
    print(f"\nSample apartments (first 5):")
    for apt in apartments[:5]:
        has_owner = apt['owner_user_id'] is not None
        has_current = apt['current_resident_id'] is not None
        same = has_owner and has_current and apt['owner_user_id'] == apt['current_resident_id']
        
        if same:
            status = "Owner-occupied"
        elif has_current and not same:
            status = "Tenant-occupied"
        elif has_owner and not has_current:
            status = "Owner (empty)"
        else:
            status = "Empty"
        
        print(f"  Daire {apt['unit_number']}: {status}")

print("\n" + "=" * 80)
print("SITE TOTALS")
print("=" * 80)
print(f"Total Owners: {total_owners}")
print(f"Total Tenants: {total_tenants}")
print(f"Total Residents: {total_residents}")
print("=" * 80)

cursor.close()
conn.close()
