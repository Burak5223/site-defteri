import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("TÜM SORUNLARI DÜZELT")
print("=" * 80)

# 1. BLOK İSİMLERİNİ DÜZELT
print("\n1. Blok isimlerini düzeltiyorum...")
cursor.execute("UPDATE blocks SET name = 'A Blok' WHERE name LIKE '%A%' AND site_id = '1'")
cursor.execute("UPDATE blocks SET name = 'B Blok' WHERE name LIKE '%B%' AND site_id = '1'")
cursor.execute("UPDATE blocks SET name = 'C Blok' WHERE name LIKE '%C%' AND site_id = '1'")

# Apartmanlardaki block_name'leri de güncelle
cursor.execute("UPDATE apartments a JOIN blocks b ON a.block_id = b.id SET a.block_name = b.name WHERE a.site_id = '1'")
conn.commit()
print("✓ Blok isimleri düzeltildi")

# 2. DUPLICATE DAİRE NUMARALARINI KONTROL ET
print("\n2. Duplicate daire numaralarını kontrol ediyorum...")
cursor.execute("""
    SELECT unit_number, block_name, COUNT(*) as count
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY unit_number, block_name
    HAVING COUNT(*) > 1
""")
duplicates = cursor.fetchall()

if duplicates:
    print(f"⚠️ {len(duplicates)} duplicate bulundu:")
    for dup in duplicates:
        print(f"   {dup['block_name']} - Daire {dup['unit_number']}: {dup['count']} kez")
else:
    print("✓ Duplicate yok")

# 3. HER BLOKTAKI DAİRELERİ KONTROL ET
print("\n3. Blok bazında daire kontrolü...")
cursor.execute("""
    SELECT block_name, 
           COUNT(*) as total,
           MIN(CAST(unit_number AS UNSIGNED)) as min_num,
           MAX(CAST(unit_number AS UNSIGNED)) as max_num
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY block_name
    ORDER BY block_name
""")
blocks = cursor.fetchall()

for block in blocks:
    print(f"{block['block_name']}: {block['total']} daire (Numara: {block['min_num']}-{block['max_num']})")

# 4. MALİK VE KİRACI SAYILARINI KONTROL ET
print("\n4. Malik ve kiracı sayıları...")
cursor.execute("""
    SELECT 
        block_name,
        COUNT(*) as total_apartments,
        SUM(CASE WHEN owner_user_id IS NOT NULL AND owner_user_id != '' THEN 1 ELSE 0 END) as owners,
        SUM(CASE WHEN current_resident_id IS NOT NULL AND current_resident_id != '' THEN 1 ELSE 0 END) as tenants
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY block_name
    ORDER BY block_name
""")
stats = cursor.fetchall()

for stat in stats:
    print(f"{stat['block_name']}: {stat['total_apartments']} daire, {stat['owners']} malik, {stat['tenants']} kiracı")

# 5. İLK 20 DAİREYİ GÖSTER
print("\n5. İlk 20 daire (sıralı)...")
cursor.execute("""
    SELECT 
        unit_number,
        block_name,
        owner_user_id,
        current_resident_id
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    ORDER BY CAST(unit_number AS UNSIGNED)
    LIMIT 20
""")
apartments = cursor.fetchall()

for apt in apartments:
    owner = "✓" if apt['owner_user_id'] else "✗"
    tenant = "✓" if apt['current_resident_id'] else "✗"
    print(f"Daire {apt['unit_number']:>3} ({apt['block_name']}): Malik:{owner} Kiracı:{tenant}")

print("\n" + "=" * 80)
print("ÖZET")
print("=" * 80)
print(f"Toplam blok: {len(blocks)}")
print(f"Toplam daire: {sum([b['total'] for b in blocks])}")
print(f"Duplicate: {len(duplicates)}")
print("=" * 80)

cursor.close()
conn.close()
