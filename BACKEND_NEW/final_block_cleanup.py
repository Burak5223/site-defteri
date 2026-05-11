import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=== BLOK ADI TEMİZLİĞİ ===\n")

# Blocks tablosunda "A Blok" -> "A" gibi düzeltmeler
cursor.execute("UPDATE blocks SET name = 'A' WHERE name LIKE '%A%' AND site_id = '1'")
a_count = cursor.rowcount

cursor.execute("UPDATE blocks SET name = 'B' WHERE name LIKE '%B%' AND site_id = '1'")
b_count = cursor.rowcount

cursor.execute("UPDATE blocks SET name = 'C' WHERE name LIKE '%C%' AND site_id = '1'")
c_count = cursor.rowcount

conn.commit()
print(f"✓ Blocks tablosu güncellendi (A: {a_count}, B: {b_count}, C: {c_count})")

# Apartments tablosunda da aynı temizlik
cursor.execute("UPDATE apartments SET block_name = 'A' WHERE block_name LIKE '%A%' AND site_id = '1'")
a_apt_count = cursor.rowcount

cursor.execute("UPDATE apartments SET block_name = 'B' WHERE block_name LIKE '%B%' AND site_id = '1'")
b_apt_count = cursor.rowcount

cursor.execute("UPDATE apartments SET block_name = 'C' WHERE block_name LIKE '%C%' AND site_id = '1'")
c_apt_count = cursor.rowcount

conn.commit()
print(f"✓ Apartments tablosu güncellendi (A: {a_apt_count}, B: {b_apt_count}, C: {c_apt_count})")

# NULL veya boş block_name'leri düzelt
cursor.execute("""
    SELECT a.id, a.unit_number, a.block_id
    FROM apartments a
    WHERE a.site_id = '1'
    AND (a.block_name IS NULL OR a.block_name = '')
""")

null_apartments = cursor.fetchall()

if len(null_apartments) > 0:
    print(f"\n✓ {len(null_apartments)} dairenin block_name'i boş, düzeltiliyor...")
    
    for apt in null_apartments:
        apt_id = apt[0]
        apt_number = apt[1]
        block_id = apt[2]
        
        # Block ID'den block name'i al
        cursor.execute("SELECT name FROM blocks WHERE id = %s", (block_id,))
        result = cursor.fetchone()
        
        if result:
            block_name = result[0]
            cursor.execute("UPDATE apartments SET block_name = %s WHERE id = %s", (block_name, apt_id))
            print(f"  - Daire {apt_number} -> {block_name} Blok")
    
    conn.commit()
    print(f"✓ Boş block_name'ler düzeltildi")
else:
    print("\n✓ Tüm dairelerin block_name'i dolu")

# Son durum
print("\n\n=== SON DURUM ===")
cursor.execute("""
    SELECT block_name, COUNT(*) as count
    FROM apartments
    WHERE site_id = '1'
    GROUP BY block_name
    ORDER BY block_name
""")

results = cursor.fetchall()
total = 0
for result in results:
    print(f"  {result[0]} Blok: {result[1]} daire")
    total += result[1]

print(f"\nToplam: {total} daire")

cursor.close()
conn.close()
