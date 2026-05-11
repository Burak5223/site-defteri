import mysql.connector
import uuid
import random

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("CONSTRAINT KALDIRMA VE YENİDEN NUMARALANDIRMA")
print("=" * 80)

# Constraint'i kaldır
print("\n1. Foreign key ve unique constraint kaldırılıyor...")
try:
    cursor.execute("ALTER TABLE apartments DROP FOREIGN KEY apartments_ibfk_1")
    print("✓ Foreign key kaldırıldı")
except Exception as e:
    print(f"⚠️ FK Hata: {e}")

try:
    cursor.execute("ALTER TABLE apartments DROP INDEX unique_unit_per_block")
    print("✓ Unique constraint kaldırıldı")
except Exception as e:
    print(f"⚠️ UC Hata: {e}")

conn.commit()

# Tüm dairelere geçici numara ver
print("\n2. Geçici numaralar veriliyor...")
cursor.execute("SELECT id FROM apartments WHERE site_id = '1' AND is_deleted = 0")
all_apts = cursor.fetchall()
for apt in all_apts:
    temp_num = f"T_{uuid.uuid4().hex[:12]}"
    cursor.execute("UPDATE apartments SET unit_number = %s WHERE id = %s", (temp_num, apt['id']))
conn.commit()
print(f"✓ {len(all_apts)} daireye geçici numara verildi")

# Blokları al
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' AND is_deleted = 0 ORDER BY name")
blocks = cursor.fetchall()

# Gerçek numaraları ver
print("\n3. Gerçek numaralar veriliyor...")
current_number = 1

for block in blocks:
    cursor.execute("""
        SELECT id
        FROM apartments 
        WHERE site_id = '1' AND block_id = %s AND is_deleted = 0
        ORDER BY id
    """, (block['id'],))
    
    apartments = cursor.fetchall()
    
    for apt in apartments:
        cursor.execute("UPDATE apartments SET unit_number = %s WHERE id = %s", (str(current_number), apt['id']))
        current_number += 1
    
    print(f"  {block['name']}: {len(apartments)} daire ({current_number - len(apartments) - 1} - {current_number - 1})")

conn.commit()

# Constraint'leri geri ekle
print("\n4. Constraint'ler geri ekleniyor...")
try:
    cursor.execute("ALTER TABLE apartments ADD CONSTRAINT apartments_ibfk_1 FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE")
    print("✓ Foreign key eklendi")
except Exception as e:
    print(f"⚠️ FK Hata: {e}")

conn.commit()

# Son durum
print(f"\n" + "=" * 80)
print("SON DURUM")
print("=" * 80)

cursor.execute("SELECT COUNT(*) as total FROM apartments WHERE site_id = '1' AND is_deleted = 0")
final_total = cursor.fetchone()['total']
print(f"Toplam daire: {final_total}")

for block in blocks:
    cursor.execute("""
        SELECT COUNT(*) as count,
               MIN(CAST(unit_number AS UNSIGNED)) as min_num,
               MAX(CAST(unit_number AS UNSIGNED)) as max_num
        FROM apartments 
        WHERE block_id = %s AND is_deleted = 0
    """, (block['id'],))
    result = cursor.fetchone()
    print(f"  {block['name']}: {result['count']} daire (Numara: {result['min_num']}-{result['max_num']})")

# Duplicate kontrol
cursor.execute("""
    SELECT unit_number, COUNT(*) as count
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
    GROUP BY unit_number
    HAVING COUNT(*) > 1
""")
duplicates = cursor.fetchall()

if duplicates:
    print(f"\n⚠️ Duplicate var:")
    for dup in duplicates:
        print(f"  Daire {dup['unit_number']}: {dup['count']} kez")
else:
    print(f"\n✓ Tüm daire numaraları benzersiz!")

print("=" * 80)

cursor.close()
conn.close()
