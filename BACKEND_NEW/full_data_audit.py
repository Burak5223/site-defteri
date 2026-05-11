import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("TAM VERİ DENETİMİ")
print("=" * 80)

# 1. Toplam daire sayısı
print("\n1. DAİRE SAYISI")
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
total_apartments = cursor.fetchone()['total']
print(f"   Toplam daire: {total_apartments}")

# 2. Duplicate daire numaraları
print("\n2. DUPLICATE DAİRE NUMARALARI")
cursor.execute("""
    SELECT unit_number, COUNT(*) as count
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY unit_number
    HAVING COUNT(*) > 1
""")
duplicates = cursor.fetchall()
if duplicates:
    print(f"   ⚠️ {len(duplicates)} duplicate numara var:")
    for dup in duplicates[:10]:  # İlk 10'unu göster
        print(f"      Daire {dup['unit_number']}: {dup['count']} kez")
else:
    print("   ✓ Duplicate yok")

# 3. Blok bazında dağılım
print("\n3. BLOK BAZINDA DAĞILIM")
cursor.execute("""
    SELECT b.name as block_name, COUNT(a.id) as count
    FROM apartments a
    LEFT JOIN blocks b ON a.block_id = b.id
    WHERE a.site_id = '1' AND a.is_deleted = 0
    GROUP BY b.name
    ORDER BY b.name
""")
blocks = cursor.fetchall()
total_in_blocks = 0
for block in blocks:
    print(f"   {block['block_name']}: {block['count']} daire")
    total_in_blocks += block['count']
print(f"   Toplam: {total_in_blocks}")

# 4. Sahibi olmayan daireler
print("\n4. SAHİBİ OLMAYAN DAİRELER")
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (owner_user_id IS NULL OR owner_user_id = '')
""")
without_owner = cursor.fetchone()['count']
print(f"   Sahibi olmayan: {without_owner} daire")

if without_owner > 0:
    cursor.execute("""
        SELECT id, unit_number, block_name
        FROM apartments 
        WHERE site_id = '1' AND is_deleted = 0 
        AND (owner_user_id IS NULL OR owner_user_id = '')
        ORDER BY unit_number
        LIMIT 10
    """)
    print("   İlk 10 daire:")
    for apt in cursor.fetchall():
        print(f"      {apt['block_name']} - Daire {apt['unit_number']}")

# 5. Malik ve kiracı sayıları
print("\n5. MALİK VE KİRACI SAYILARI")
cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND owner_user_id IS NOT NULL AND owner_user_id != ''
""")
with_owner = cursor.fetchone()['count']

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND current_resident_id IS NOT NULL AND current_resident_id != ''
""")
with_tenant = cursor.fetchone()['count']

print(f"   Malik olan daire: {with_owner}")
print(f"   Kiracı olan daire: {with_tenant}")

# 6. Benzersiz sakin sayısı
print("\n6. BENZERSIZ SAKİN SAYISI")
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) as count
    FROM (
        SELECT owner_user_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND owner_user_id IS NOT NULL
        UNION
        SELECT current_resident_id as user_id FROM apartments WHERE site_id = '1' AND is_deleted = 0 AND current_resident_id IS NOT NULL
    ) as all_residents
""")
total_residents = cursor.fetchone()['count']
print(f"   Toplam benzersiz sakin: {total_residents}")

# 7. Site üyeliği olan sakinler
print("\n7. SİTE ÜYELİĞİ OLAN SAKİNLER")
cursor.execute("""
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_site_memberships
    WHERE site_id = '1'
""")
members = cursor.fetchone()['count']
print(f"   Site üyesi: {members}")

print("\n" + "=" * 80)
print("ÖZET")
print("=" * 80)
print(f"Toplam daire: {total_apartments}")
print(f"Duplicate numara: {len(duplicates) if duplicates else 0}")
print(f"Sahibi olmayan: {without_owner}")
print(f"Malik olan: {with_owner}")
print(f"Kiracı olan: {with_tenant}")
print(f"Benzersiz sakin: {total_residents}")
print("=" * 80)

cursor.close()
conn.close()
