import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("DAİRE VE BLOK DURUMU KONTROLÜ")
print("=" * 80)

# Toplam daire sayısı
cursor.execute("SELECT COUNT(*) as total FROM apartments WHERE site_id = '1' AND is_deleted = 0")
total = cursor.fetchone()['total']
print(f"\nToplam daire sayısı: {total}")

# Bloğu olmayan daireler (block_id NULL veya boş)
cursor.execute("""
    SELECT COUNT(*) as without_block 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (block_id IS NULL OR block_id = '' OR block_id = '0')
""")
without_block = cursor.fetchone()['without_block']
print(f"Bloğu olmayan daire sayısı: {without_block}")

# Bloğu olan daireler
cursor.execute("""
    SELECT COUNT(*) as with_block 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND block_id IS NOT NULL AND block_id != '' AND block_id != '0'
""")
with_block = cursor.fetchone()['with_block']
print(f"Bloğu olan daire sayısı: {with_block}")

# Mevcut blokları listele
print(f"\n" + "=" * 80)
print("MEVCUT BLOKLAR")
print("=" * 80)
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()
for block in blocks:
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM apartments 
        WHERE block_id = %s AND is_deleted = 0
    """, (block['id'],))
    count = cursor.fetchone()['count']
    print(f"{block['name']} (ID: {block['id']}): {count} daire")

# Bloğu olmayan daireleri listele
if without_block > 0:
    print(f"\n" + "=" * 80)
    print("BLOĞU OLMAYAN DAİRELER")
    print("=" * 80)
    cursor.execute("""
        SELECT id, unit_number, block_id, block_name
        FROM apartments 
        WHERE site_id = '1' AND is_deleted = 0 
        AND (block_id IS NULL OR block_id = '' OR block_id = '0')
        ORDER BY unit_number
        LIMIT 20
    """)
    for apt in cursor.fetchall():
        print(f"Daire {apt['unit_number']} (ID: {apt['id']}, block_id: {apt['block_id']}, block_name: {apt['block_name']})")
    
    # Varsayılan blok oluştur veya bul
    print(f"\n" + "=" * 80)
    print("ÇÖZÜM: Bloğu olmayan dairelere blok atanıyor...")
    print("=" * 80)
    
    # A Blok'u bul veya oluştur
    cursor.execute("SELECT id FROM blocks WHERE site_id = '1' AND name = 'A Blok' AND is_deleted = 0")
    result = cursor.fetchone()
    
    if result:
        default_block_id = result['id']
        print(f"Mevcut 'A Blok' kullanılacak (ID: {default_block_id})")
    else:
        import uuid
        default_block_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO blocks (id, site_id, name, description, total_floors, is_deleted)
            VALUES (%s, '1', 'A Blok', 'Varsayılan blok', 5, 0)
        """, (default_block_id,))
        conn.commit()
        print(f"Yeni 'A Blok' oluşturuldu (ID: {default_block_id})")
    
    # Bloğu olmayan dairelere blok ata
    cursor.execute("""
        UPDATE apartments 
        SET block_id = %s, block_name = 'A Blok'
        WHERE site_id = '1' AND is_deleted = 0 
        AND (block_id IS NULL OR block_id = '' OR block_id = '0')
    """, (default_block_id,))
    
    updated_count = cursor.rowcount
    conn.commit()
    print(f"✓ {updated_count} daireye 'A Blok' atandı")

# Son durumu göster
print(f"\n" + "=" * 80)
print("SON DURUM")
print("=" * 80)
cursor.execute("SELECT COUNT(*) as total FROM apartments WHERE site_id = '1' AND is_deleted = 0")
total = cursor.fetchone()['total']
print(f"Toplam daire sayısı: {total}")

cursor.execute("""
    SELECT COUNT(*) as without_block 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0 
    AND (block_id IS NULL OR block_id = '' OR block_id = '0')
""")
without_block = cursor.fetchone()['without_block']
print(f"Bloğu olmayan daire sayısı: {without_block}")

cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()
print(f"\nBlok bazında dağılım:")
for block in blocks:
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM apartments 
        WHERE block_id = %s AND is_deleted = 0
    """, (block['id'],))
    count = cursor.fetchone()['count']
    print(f"  {block['name']}: {count} daire")

print("=" * 80)

cursor.close()
conn.close()
