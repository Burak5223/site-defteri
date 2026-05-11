import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=== 'DİĞER' BLOKTAKI DAİRELER ===\n")

# "Diğer" veya boş blok adına sahip daireleri bul
cursor.execute("""
    SELECT a.id, a.unit_number, a.block_name, a.block_id
    FROM apartments a
    WHERE a.site_id = '1'
    AND (a.block_name IS NULL OR a.block_name = '' OR a.block_name = 'Diğer' OR a.block_name NOT IN ('A', 'B', 'C'))
""")

other_apartments = cursor.fetchall()

print(f"Toplam 'Diğer' bloktaki daire sayısı: {len(other_apartments)}")

if len(other_apartments) > 0:
    print("\nDaireler:")
    for apt in other_apartments:
        print(f"  - Daire {apt[1]}, Block Name: '{apt[2]}', Block ID: {apt[3]}")

# A, B, C bloklarının ID'lerini al
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND name IN ('A', 'B', 'C') ORDER BY name")
blocks = cursor.fetchall()

print(f"\n\n=== MEVCUT BLOKLAR ===")
for block in blocks:
    print(f"  - {block[1]} Blok (ID: {block[0]})")

if len(other_apartments) > 0 and len(blocks) > 0:
    print(f"\n\n=== DAİRELER BLOKLARA TAŞINIYOR ===\n")
    
    # Daireleri döngüsel olarak A, B, C bloklarına dağıt
    for i, apt in enumerate(other_apartments):
        apt_id = apt[0]
        apt_number = apt[1]
        old_block_name = apt[2] if apt[2] else "Boş"
        
        # Döngüsel olarak blok seç
        target_block = blocks[i % len(blocks)]
        target_block_id = target_block[0]
        target_block_name = target_block[1]
        
        try:
            cursor.execute("""
                UPDATE apartments 
                SET block_id = %s, block_name = %s
                WHERE id = %s
            """, (target_block_id, target_block_name, apt_id))
            
            print(f"✓ Daire {apt_number} ({old_block_name}) -> {target_block_name} Blok")
        except Exception as e:
            print(f"✗ Hata: Daire {apt_number} - {e}")
    
    conn.commit()
    print(f"\n✓ {len(other_apartments)} daire bloklara taşındı!")
else:
    print("\n✓ Taşınacak daire yok veya hedef blok bulunamadı!")

# Sonuç kontrolü
print("\n\n=== BLOK BAZINDA DAİRE SAYILARI ===")
cursor.execute("""
    SELECT 
        COALESCE(block_name, 'Diğer') as block_name,
        COUNT(*) as apartment_count
    FROM apartments
    WHERE site_id = '1'
    GROUP BY block_name
    ORDER BY block_name
""")

results = cursor.fetchall()
for result in results:
    print(f"  {result[0]} Blok: {result[1]} daire")

cursor.close()
conn.close()
