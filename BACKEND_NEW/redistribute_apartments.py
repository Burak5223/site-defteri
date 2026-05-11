import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("DAİRELERİ YENİDEN DAĞIT (34-34-34)")
print("=" * 80)

# Blokları al
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()

# Tüm daireleri al
cursor.execute("""
    SELECT id, unit_number, block_id, block_name, owner_user_id, current_resident_id
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    ORDER BY CAST(unit_number AS UNSIGNED)
""")
all_apartments = cursor.fetchall()

print(f"\nToplam daire: {len(all_apartments)}")
print(f"Toplam blok: {len(blocks)}")

# Her bloğa 34 daire
apartments_per_block = 34
apartment_number = 1

for i, block in enumerate(blocks):
    start_idx = i * apartments_per_block
    end_idx = start_idx + apartments_per_block
    
    block_apartments = all_apartments[start_idx:end_idx]
    
    print(f"\n{block['name']}: {len(block_apartments)} daire (Numara: {apartment_number}-{apartment_number+len(block_apartments)-1})")
    
    for apt in block_apartments:
        cursor.execute("""
            UPDATE apartments 
            SET block_id = %s, block_name = %s, unit_number = %s
            WHERE id = %s
        """, (block['id'], block['name'], str(apartment_number), apt['id']))
        apartment_number += 1

conn.commit()

# Kontrol
print("\n" + "=" * 80)
print("KONTROL")
print("=" * 80)

cursor.execute("""
    SELECT block_name, 
           COUNT(*) as total,
           MIN(CAST(unit_number AS UNSIGNED)) as min_num,
           MAX(CAST(unit_number AS UNSIGNED)) as max_num,
           SUM(CASE WHEN owner_user_id IS NOT NULL AND owner_user_id != '' THEN 1 ELSE 0 END) as owners,
           SUM(CASE WHEN current_resident_id IS NOT NULL AND current_resident_id != '' THEN 1 ELSE 0 END) as tenants
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY block_name
    ORDER BY block_name
""")
stats = cursor.fetchall()

for stat in stats:
    print(f"{stat['block_name']}: {stat['total']} daire (#{stat['min_num']}-{stat['max_num']}), {stat['owners']} malik, {stat['tenants']} kiracı")

print("=" * 80)

cursor.close()
conn.close()
