import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("DETAYLI DAİRE SAYISI KONTROLÜ")
print("=" * 80)

# Tüm daireler (is_deleted dahil)
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1'
""")
all_apartments = cursor.fetchone()['total']
print(f"\nToplam daire (is_deleted dahil): {all_apartments}")

# Silinmemiş daireler
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
active_apartments = cursor.fetchone()['total']
print(f"Aktif daire (is_deleted = 0): {active_apartments}")

# Silinmiş daireler
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 1
""")
deleted_apartments = cursor.fetchone()['total']
print(f"Silinmiş daire (is_deleted = 1): {deleted_apartments}")

# Blok bazında dağılım (tüm daireler)
print(f"\n" + "=" * 80)
print("BLOK BAZINDA DAĞILIM (TÜM DAİRELER)")
print("=" * 80)
cursor.execute("""
    SELECT 
        COALESCE(b.name, 'Bloğu Yok') as block_name,
        COUNT(a.id) as count,
        SUM(CASE WHEN a.is_deleted = 0 THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN a.is_deleted = 1 THEN 1 ELSE 0 END) as deleted_count
    FROM apartments a
    LEFT JOIN blocks b ON a.block_id = b.id
    WHERE a.site_id = '1'
    GROUP BY b.name
    ORDER BY b.name
""")
blocks = cursor.fetchall()
for block in blocks:
    print(f"{block['block_name']}: {block['count']} daire (Aktif: {block['active_count']}, Silinmiş: {block['deleted_count']})")

# Benzersiz daire numaraları
print(f"\n" + "=" * 80)
print("BENZERSIZ DAİRE NUMARALARI")
print("=" * 80)
cursor.execute("""
    SELECT COUNT(DISTINCT unit_number) as unique_numbers
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
unique_numbers = cursor.fetchone()['unique_numbers']
print(f"Benzersiz daire numarası sayısı: {unique_numbers}")

# Duplicate daire numaraları var mı?
cursor.execute("""
    SELECT unit_number, COUNT(*) as count
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY unit_number
    HAVING COUNT(*) > 1
""")
duplicates = cursor.fetchall()
if duplicates:
    print(f"\n⚠️ Duplicate daire numaraları:")
    for dup in duplicates:
        print(f"  Daire {dup['unit_number']}: {dup['count']} kez var")
else:
    print(f"\n✓ Duplicate daire numarası yok")

# Backend'in döndüreceği sayı
print(f"\n" + "=" * 80)
print("BACKEND SONUCU")
print("=" * 80)
print(f"Backend'in döndüreceği daire sayısı: {active_apartments}")
print(f"Uygulamada gösterilen: 102")
print(f"Fark: {102 - active_apartments}")

if active_apartments < 102:
    print(f"\n⚠️ {102 - active_apartments} daire eksik! Eklenmeli.")
elif active_apartments > 102:
    print(f"\n⚠️ {active_apartments - 102} fazla daire var! Silinmeli veya kontrol edilmeli.")
else:
    print(f"\n✓ Daire sayısı doğru!")

print("=" * 80)

cursor.close()
conn.close()
