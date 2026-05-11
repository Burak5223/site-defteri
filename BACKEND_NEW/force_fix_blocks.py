import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

# Tüm blokları al
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' ORDER BY name")
all_blocks = cursor.fetchall()

print("Mevcut bloklar:")
for block in all_blocks:
    print(f"  ID: {block[0]}, Name: {block[1]}")

# Her bloğu düzelt
for block in all_blocks:
    block_id = block[0]
    old_name = block[1]
    
    # Yeni adı belirle
    if 'A' in old_name.upper():
        new_name = 'A'
    elif 'B' in old_name.upper():
        new_name = 'B'
    elif 'C' in old_name.upper():
        new_name = 'C'
    else:
        continue
    
    # Blocks tablosunu güncelle
    cursor.execute("UPDATE blocks SET name = %s WHERE id = %s", (new_name, block_id))
    
    # Apartments tablosunu güncelle
    cursor.execute("UPDATE apartments SET block_name = %s WHERE block_id = %s", (new_name, block_id))
    apt_count = cursor.rowcount
    
    print(f"\n✓ {old_name} -> {new_name} ({apt_count} daire)")

conn.commit()
print("\n✓ Apartments tablosu düzeltildi")

# Kontrol
cursor.execute("""
    SELECT block_name, COUNT(*) 
    FROM apartments 
    WHERE site_id = '1' 
    GROUP BY block_name
""")

print("\n=== SON DURUM ===")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} daire")

cursor.close()
conn.close()
