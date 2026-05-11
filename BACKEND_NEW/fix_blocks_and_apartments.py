import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("BLOKLARI VE DAİRELERİ DÜZELT")
print("=" * 80)

# 1. Blokları kontrol et
print("\n1. Blokları kontrol ediyorum...")
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()
print(f"Bulunan bloklar: {len(blocks)}")
for block in blocks:
    print(f"  - {block['name']} (ID: {block['id']})")

if len(blocks) != 3:
    print("\n⚠️ 3 blok olmalı! Düzeltiliyor...")
    # Tüm blokları sil ve yeniden oluştur
    cursor.execute("UPDATE blocks SET is_deleted = 1 WHERE site_id = '1'")
    
    # 3 blok oluştur
    import uuid
    block_ids = []
    for block_name in ['A Blok', 'B Blok', 'C Blok']:
        block_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO blocks (id, site_id, name, total_floors, is_deleted, created_at, updated_at)
            VALUES (%s, '1', %s, 10, 0, NOW(), NOW())
        """, (block_id, block_name))
        block_ids.append({'id': block_id, 'name': block_name})
        print(f"  ✓ {block_name} oluşturuldu")
    
    conn.commit()
    blocks = block_ids

# 2. Daireleri bloklara dağıt
print("\n2. Daireleri bloklara dağıtıyorum...")

# Her bloğa 34 daire
apartments_per_block = 34
apartment_number = 1

for i, block in enumerate(blocks):
    start_num = i * apartments_per_block + 1
    end_num = start_num + apartments_per_block
    
    print(f"\n{block['name']}: Daire {start_num}-{end_num-1}")
    
    # Bu bloktaki daireleri güncelle
    cursor.execute("""
        SELECT id, unit_number 
        FROM apartments 
        WHERE site_id = '1' AND is_deleted = 0
        ORDER BY CAST(unit_number AS UNSIGNED)
        LIMIT %s OFFSET %s
    """, (apartments_per_block, i * apartments_per_block))
    
    apts = cursor.fetchall()
    
    for j, apt in enumerate(apts):
        new_number = start_num + j
        cursor.execute("""
            UPDATE apartments 
            SET block_id = %s, block_name = %s, unit_number = %s
            WHERE id = %s
        """, (block['id'], block['name'], str(new_number), apt['id']))
    
    print(f"  ✓ {len(apts)} daire güncellendi")

conn.commit()

# 3. Kontrol
print("\n" + "=" * 80)
print("KONTROL")
print("=" * 80)

cursor.execute("""
    SELECT block_name, 
           COUNT(*) as total,
           MIN(CAST(unit_number AS UNSIGNED)) as min_num,
           MAX(CAST(unit_number AS UNSIGNED)) as max_num,
           SUM(CASE WHEN owner_user_id IS NOT NULL THEN 1 ELSE 0 END) as owners,
           SUM(CASE WHEN current_resident_id IS NOT NULL THEN 1 ELSE 0 END) as tenants
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY block_name
    ORDER BY block_name
""")
stats = cursor.fetchall()

for stat in stats:
    print(f"{stat['block_name']}: {stat['total']} daire (#{stat['min_num']}-{stat['max_num']}), {stat['owners']} malik, {stat['tenants']} kiracı")

cursor.execute("SELECT COUNT(*) as total FROM apartments WHERE site_id = '1' AND is_deleted = 0")
total = cursor.fetchone()['total']
print(f"\nToplam: {total} daire")

print("=" * 80)

cursor.close()
conn.close()
