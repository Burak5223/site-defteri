import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== VERIFYING ALL RESIDENTS HAVE COMPLETE DETAILS ===\n")

# 1. Tüm sakinleri ve daire bilgilerini getir
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        a.block_name,
        a.unit_number,
        a.floor,
        b.site_id,
        s.name as site_name,
        CASE 
            WHEN a.owner_user_id = u.id THEN 'owner'
            WHEN a.current_resident_id = u.id THEN 'tenant'
        END as resident_type
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    LEFT JOIN apartments a ON (u.id = a.current_resident_id OR u.id = a.owner_user_id)
    LEFT JOIN blocks b ON a.block_id = b.id
    LEFT JOIN sites s ON b.site_id = s.id
    WHERE usm.site_id = '1'
    AND usm.role_type = 'sakin'
    AND usm.status = 'aktif'
    AND usm.is_deleted = 0
    ORDER BY a.block_name, a.unit_number
""")

residents = cursor.fetchall()

print(f"Total residents: {len(residents)}\n")

# 2. Eksik bilgileri kontrol et
missing_apartment = []
missing_block = []
missing_site = []
complete = []

for resident in residents:
    user_id, full_name, email, block_name, unit_number, floor, site_id, site_name, resident_type = resident
    
    if not unit_number:
        missing_apartment.append(full_name)
    elif not block_name:
        missing_block.append(full_name)
    elif not site_id:
        missing_site.append(full_name)
    else:
        complete.append(resident)

print("=== STATISTICS ===")
print(f"✓ Complete records: {len(complete)}")
print(f"✗ Missing apartment: {len(missing_apartment)}")
print(f"✗ Missing block: {len(missing_block)}")
print(f"✗ Missing site: {len(missing_site)}")

if missing_apartment:
    print("\nResidents without apartment:")
    for name in missing_apartment[:5]:
        print(f"  - {name}")

if missing_block:
    print("\nResidents without block:")
    for name in missing_block[:5]:
        print(f"  - {name}")

if missing_site:
    print("\nResidents without site:")
    for name in missing_site[:5]:
        print(f"  - {name}")

# 3. Örnek tam kayıtlar
if complete:
    print("\n=== SAMPLE COMPLETE RECORDS ===")
    for resident in complete[:5]:
        user_id, full_name, email, block_name, unit_number, floor, site_id, site_name, resident_type = resident
        print(f"\n{full_name}")
        print(f"  Email: {email}")
        print(f"  Site: {site_name} (ID: {site_id})")
        print(f"  Block: {block_name}")
        print(f"  Apartment: {unit_number} (Floor {floor})")
        print(f"  Type: {resident_type}")

# 4. Blok bazında dağılım
cursor.execute("""
    SELECT 
        a.block_name,
        COUNT(DISTINCT CASE WHEN a.current_resident_id IS NOT NULL THEN a.current_resident_id END) as residents,
        COUNT(DISTINCT CASE WHEN a.owner_user_id IS NOT NULL THEN a.owner_user_id END) as owners
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.block_name IS NOT NULL
    AND a.block_name != 'None'
    GROUP BY a.block_name
    ORDER BY a.block_name
""")

block_distribution = cursor.fetchall()

print("\n=== DISTRIBUTION BY BLOCK ===")
for block in block_distribution:
    block_name, residents_count, owners_count = block
    print(f"{block_name}: {residents_count} residents, {owners_count} owners")

print("\n=== FINAL RESULT ===")
if len(complete) == len(residents) and len(missing_apartment) == 0:
    print("✓ SUCCESS! All residents have:")
    print("  - Site assignment")
    print("  - Block assignment")
    print("  - Apartment assignment")
    print("  - Complete details")
else:
    print("⚠ Some residents are missing information")

cursor.close()
conn.close()

print("\n=== DONE ===")
