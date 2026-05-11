import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("BLOK İSİMLERİNİ DÜZELT")
print("=" * 80)

# Blokları ID sırasına göre al
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY id")
blocks = cursor.fetchall()

print(f"\nMevcut bloklar ({len(blocks)} adet):")
for i, block in enumerate(blocks):
    print(f"{i+1}. ID: {block['id']}, İsim: {block['name']}")

# İsimleri düzelt
new_names = ['A Blok', 'B Blok', 'C Blok']
print("\nİsimleri güncelliyorum...")

for i, block in enumerate(blocks):
    new_name = new_names[i] if i < len(new_names) else f"Blok {i+1}"
    cursor.execute("UPDATE blocks SET name = %s WHERE id = %s", (new_name, block['id']))
    print(f"  {block['name']} -> {new_name}")

# Apartmanlardaki block_name'leri de güncelle
for i, block in enumerate(blocks):
    new_name = new_names[i] if i < len(new_names) else f"Blok {i+1}"
    cursor.execute("UPDATE apartments SET block_name = %s WHERE block_id = %s", (new_name, block['id']))

conn.commit()

# Kontrol
print("\nGüncellenmiş bloklar:")
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()
for block in blocks:
    cursor.execute("SELECT COUNT(*) as count FROM apartments WHERE block_id = %s AND is_deleted = 0", (block['id'],))
    count = cursor.fetchone()['count']
    print(f"  {block['name']}: {count} daire")

print("\n" + "=" * 80)
print("✓ TAMAMLANDI")
print("=" * 80)

cursor.close()
conn.close()
