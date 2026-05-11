import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

# Toplam daire sayısı
cursor.execute("SELECT COUNT(*) as total FROM apartments WHERE site_id = 1")
total = cursor.fetchone()['total']
print(f"Toplam daire sayısı: {total}")

# Bloğu olmayan daireler
cursor.execute("""
    SELECT COUNT(*) as without_block 
    FROM apartments 
    WHERE site_id = 1 AND (block_id IS NULL OR block_id = '')
""")
without_block = cursor.fetchone()['without_block']
print(f"Bloğu olmayan daire sayısı: {without_block}")

# Bloğu olan daireler
cursor.execute("""
    SELECT COUNT(*) as with_block 
    FROM apartments 
    WHERE site_id = 1 AND block_id IS NOT NULL AND block_id != ''
""")
with_block = cursor.fetchone()['with_block']
print(f"Bloğu olan daire sayısı: {with_block}")

# Bloğu olmayan daireleri listele
if without_block > 0:
    print(f"\nBloğu olmayan daireler:")
    cursor.execute("""
        SELECT id, apartment_number, block_id 
        FROM apartments 
        WHERE site_id = 1 AND (block_id IS NULL OR block_id = '')
        ORDER BY apartment_number
    """)
    for apt in cursor.fetchall():
        print(f"  Daire {apt['apartment_number']} (ID: {apt['id']}, block_id: {apt['block_id']})")

# Mevcut blokları listele
print(f"\nMevcut bloklar:")
cursor.execute("SELECT id, block_name FROM blocks WHERE site_id = 1 ORDER BY block_name")
blocks = cursor.fetchall()
for block in blocks:
    cursor.execute("SELECT COUNT(*) as count FROM apartments WHERE block_id = %s", (block['id'],))
    count = cursor.fetchone()['count']
    print(f"  {block['block_name']} (ID: {block['id']}): {count} daire")

cursor.close()
conn.close()
