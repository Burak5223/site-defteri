import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("ADMIN GÖRÜNÜMÜ VERİFİKASYONU")
print("=" * 80)

# 1. Toplam daire sayısı (is_deleted = 0)
print("\n1. TOPLAM DAİRE SAYISI")
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
total = cursor.fetchone()['total']
print(f"   Toplam: {total} daire")

# 2. Duplicate daire numaraları kontrolü
print("\n2. DUPLICATE KONTROL")
cursor.execute("""
    SELECT unit_number, COUNT(*) as count
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY unit_number
    HAVING COUNT(*) > 1
""")
duplicates = cursor.fetchall()
if duplicates:
    print(f"   ⚠️ {len(duplicates)} duplicate var:")
    for dup in duplicates:
        print(f"      Daire {dup['unit_number']}: {dup['count']} kez")
else:
    print("   ✓ Duplicate yok")

# 3. Blok bazında dağılım
print("\n3. BLOK DAĞILIMI")
cursor.execute("""
    SELECT block_name, COUNT(*) as count
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY block_name
    ORDER BY block_name
""")
blocks = cursor.fetchall()
for block in blocks:
    print(f"   {block['block_name']}: {block['count']} daire")

# 4. Her dairenin sakin sayısı (0 sakin olanları bul)
print("\n4. 0 SAKİN OLAN DAİRELER")
cursor.execute("""
    SELECT a.unit_number, a.block_name,
           CASE 
               WHEN a.owner_user_id IS NOT NULL AND a.owner_user_id != '' THEN 1 
               ELSE 0 
           END +
           CASE 
               WHEN a.current_resident_id IS NOT NULL AND a.current_resident_id != '' THEN 1 
               ELSE 0 
           END as resident_count
    FROM apartments a
    WHERE a.site_id = '1' AND a.is_deleted = 0
    HAVING resident_count = 0
    ORDER BY a.unit_number
""")
zero_residents = cursor.fetchall()
if zero_residents:
    print(f"   ⚠️ {len(zero_residents)} daire 0 sakin:")
    for apt in zero_residents[:10]:
        print(f"      {apt['block_name']} - Daire {apt['unit_number']}")
else:
    print("   ✓ Tüm dairelerde sakin var")

# 5. Malik ve kiracı sayıları
print("\n5. MALİK VE KİRACI")
cursor.execute("""
    SELECT 
        COUNT(*) as total_apartments,
        SUM(CASE WHEN owner_user_id IS NOT NULL AND owner_user_id != '' THEN 1 ELSE 0 END) as with_owner,
        SUM(CASE WHEN current_resident_id IS NOT NULL AND current_resident_id != '' THEN 1 ELSE 0 END) as with_tenant
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
result = cursor.fetchone()
print(f"   Toplam daire: {result['total_apartments']}")
print(f"   Malik olan: {result['with_owner']}")
print(f"   Kiracı olan: {result['with_tenant']}")

# 6. Örnek daireler
print("\n6. ÖRNEK DAİRELER (İlk 10)")
cursor.execute("""
    SELECT 
        a.unit_number,
        a.block_name,
        u1.full_name as owner_name,
        u2.full_name as tenant_name
    FROM apartments a
    LEFT JOIN users u1 ON a.owner_user_id = u1.id
    LEFT JOIN users u2 ON a.current_resident_id = u2.id
    WHERE a.site_id = '1' AND a.is_deleted = 0
    ORDER BY CAST(a.unit_number AS UNSIGNED)
    LIMIT 10
""")
samples = cursor.fetchall()
for apt in samples:
    tenant_info = f" + {apt['tenant_name']}" if apt['tenant_name'] else ""
    print(f"   Daire {apt['unit_number']} ({apt['block_name']}): {apt['owner_name']}{tenant_info}")

print("\n" + "=" * 80)
print("SONUÇ")
print("=" * 80)
if total == 102 and len(duplicates) == 0 and len(zero_residents) == 0:
    print("✓ HER ŞEY TAMAM! Admin'de doğru görünmeli.")
else:
    print("⚠️ Sorunlar var:")
    if total != 102:
        print(f"   - Toplam {total} daire (102 olmalı)")
    if len(duplicates) > 0:
        print(f"   - {len(duplicates)} duplicate numara var")
    if len(zero_residents) > 0:
        print(f"   - {len(zero_residents)} dairede 0 sakin var")
print("=" * 80)

cursor.close()
conn.close()
