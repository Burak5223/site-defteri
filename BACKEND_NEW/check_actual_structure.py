import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("MEVCUT TABLO YAPISI VE VERİLER")
print("=" * 80)

# Check residency_history table
print("\n1. RESIDENCY_HISTORY TABLOSU:")
cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(DISTINCT rh.apartment_id) as apartment_count,
        COUNT(DISTINCT CASE WHEN rh.is_owner = TRUE THEN rh.user_id END) as owner_count,
        COUNT(DISTINCT CASE WHEN rh.is_owner = FALSE THEN rh.user_id END) as tenant_count
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1' AND rh.move_out_date IS NULL
    GROUP BY b.id, b.name
    ORDER BY b.name
""")

results = cursor.fetchall()

total_apartments = 0
total_owners = 0
total_tenants = 0

for block_name, apt_count, owner_count, tenant_count in results:
    print(f"\n{block_name}:")
    print(f"  Daire Sayısı: {apt_count}")
    print(f"  Malik Sayısı: {owner_count}")
    print(f"  Kiracı Sayısı: {tenant_count}")
    
    total_apartments += apt_count
    total_owners += owner_count
    total_tenants += tenant_count

print("\n" + "=" * 80)
print("TOPLAM (residency_history)")
print("=" * 80)
print(f"Toplam Daire: {total_apartments}")
print(f"Toplam Malik: {total_owners}")
print(f"Toplam Kiracı: {total_tenants}")

# Check apartments table
print("\n" + "=" * 80)
print("2. APARTMENTS TABLOSU:")
print("=" * 80)

cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(*) as apartment_count
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1' AND a.is_deleted = FALSE
    GROUP BY b.id, b.name
    ORDER BY b.name
""")

results = cursor.fetchall()
total_apts = 0

for block_name, apt_count in results:
    print(f"{block_name}: {apt_count} daire")
    total_apts += apt_count

print(f"\nToplam Daire (apartments): {total_apts}")

# Check if there are apartments without owners
print("\n" + "=" * 80)
print("3. MALİKİ OLMAYAN DAİRELER:")
print("=" * 80)

cursor.execute("""
    SELECT 
        b.name as block_name,
        a.unit_number,
        a.id
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id AND rh.is_owner = TRUE AND rh.move_out_date IS NULL
    WHERE b.site_id = '1' AND a.is_deleted = FALSE AND rh.id IS NULL
    ORDER BY b.name, a.unit_number
""")

no_owner_apts = cursor.fetchall()

if no_owner_apts:
    print(f"\nToplam {len(no_owner_apts)} dairenin maliki yok:")
    for block_name, unit_number, apt_id in no_owner_apts[:10]:  # Show first 10
        print(f"  {block_name} - Daire {unit_number}")
    if len(no_owner_apts) > 10:
        print(f"  ... ve {len(no_owner_apts) - 10} daire daha")
else:
    print("\nTüm dairelerin maliki var ✓")

print("\n" + "=" * 80)

cursor.close()
conn.close()
