import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Check A Block apartments and their residents
print("=" * 80)
print("A BLOK DAİRE VE SAKİN YAPISI")
print("=" * 80)

# Get A Block ID
cursor.execute("SELECT id, name FROM blocks WHERE name LIKE '%A%' LIMIT 1")
block = cursor.fetchone()

if block:
    block_id, block_name = block
    print(f"\nBlok: {block_name} (ID: {block_id})")
    
    # Get apartments in this block
    cursor.execute("""
        SELECT id, unit_number, owner_user_id, current_resident_id
        FROM apartments 
        WHERE block_id = %s AND is_deleted = FALSE
        ORDER BY unit_number
    """, (block_id,))
    
    apartments = cursor.fetchall()
    print(f"\nToplam Daire: {len(apartments)}")
    
    # Count owners and tenants
    total_owners = 0
    total_tenants = 0
    apartments_with_tenant = 0
    apartments_owner_only = 0
    
    for apt_id, unit_number, owner_id, resident_id in apartments:
        # Get residents from residency_history
        cursor.execute("""
            SELECT u.id, u.full_name, rh.is_owner
            FROM residency_history rh
            JOIN users u ON rh.user_id = u.id
            WHERE rh.apartment_id = %s
            ORDER BY rh.is_owner DESC
        """, (apt_id,))
        
        residents = cursor.fetchall()
        
        owner_count = sum(1 for r in residents if r[2])
        tenant_count = sum(1 for r in residents if not r[2])
        
        total_owners += owner_count
        total_tenants += tenant_count
        
        if tenant_count > 0:
            apartments_with_tenant += 1
        else:
            apartments_owner_only += 1
        
        print(f"\nDaire {unit_number}:")
        print(f"  Sakin Sayısı: {len(residents)}")
        for user_id, full_name, is_owner in residents:
            role = "MALİK" if is_owner else "KİRACI"
            print(f"    - {full_name} ({role})")
    
    print("\n" + "=" * 80)
    print("ÖZET")
    print("=" * 80)
    print(f"Toplam Daire: {len(apartments)}")
    print(f"Toplam Malik: {total_owners}")
    print(f"Toplam Kiracı: {total_tenants}")
    print(f"Kiracılı Daire: {apartments_with_tenant}")
    print(f"Sadece Malik Daire: {apartments_owner_only}")
    print("=" * 80)

cursor.close()
conn.close()
