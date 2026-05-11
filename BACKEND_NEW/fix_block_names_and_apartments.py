#!/usr/bin/env python3
"""
Blok isimlerini ve apartment block_name alanlarını düzelt
"""
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

site_id = "1"

print("=" * 80)
print("BLOK ISIMLERI VE APARTMENT BLOCK_NAME DUZELTME")
print("=" * 80)

# 1. Blok isimlerini güncelle
print("\n1. Blok isimleri guncelleniyor...")

cursor.execute("SELECT id, name FROM blocks WHERE site_id = %s", (site_id,))
blocks = cursor.fetchall()

for block in blocks:
    old_name = block['name']
    
    # Eğer sadece "A", "B", "C" ise "A Blok", "B Blok", "C Blok" yap
    if old_name in ['A', 'B', 'C']:
        new_name = f"{old_name} Blok"
        cursor.execute("UPDATE blocks SET name = %s WHERE id = %s", (new_name, block['id']))
        print(f"   {old_name} -> {new_name}")

conn.commit()

# 2. Apartment block_name alanlarını güncelle
print("\n2. Apartment block_name alanlari guncelleniyor...")

cursor.execute("""
    UPDATE apartments a
    INNER JOIN blocks b ON a.block_id = b.id
    SET a.block_name = b.name
    WHERE a.site_id = %s
""", (site_id,))

updated_count = cursor.rowcount
print(f"   {updated_count} daire guncellendi")

conn.commit()

# 3. Kontrol
print("\n3. Kontrol ediliyor...")

cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(DISTINCT a.id) as apartment_count
    FROM blocks b
    LEFT JOIN apartments a ON b.id = a.block_id
    WHERE b.site_id = %s
    GROUP BY b.id, b.name
    ORDER BY b.name
""", (site_id,))

print("\nBlok Dagilimi:")
for row in cursor.fetchall():
    print(f"   {row['block_name']}: {row['apartment_count']} daire")

# Apartment block_name kontrolü
cursor.execute("""
    SELECT DISTINCT block_name
    FROM apartments
    WHERE site_id = %s
    ORDER BY block_name
""", (site_id,))

print("\nApartment block_name degerleri:")
for row in cursor.fetchall():
    print(f"   {row['block_name']}")

print("\n" + "=" * 80)
print("ISLEM TAMAMLANDI!")
print("=" * 80)

cursor.close()
conn.close()
