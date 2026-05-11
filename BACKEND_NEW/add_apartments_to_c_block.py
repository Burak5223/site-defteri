import mysql.connector
import uuid

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

# C Blok ID'sini al
cursor.execute("SELECT id FROM blocks WHERE name = 'C' AND site_id = 1")
result = cursor.fetchone()

if not result:
    print("✗ C Blok bulunamadı!")
    cursor.close()
    conn.close()
    exit(1)

c_block_id = result[0]
print(f"✓ C Blok ID: {c_block_id}")

# C Blok'a 20 daire ekle (1-20 arası)
print("\n=== C BLOK'A DAİRELER EKLENİYOR ===")

for i in range(1, 21):
    apt_id = str(uuid.uuid4())
    unit_number = str(i)
    floor = (i - 1) // 4 + 1  # Her 4 daire 1 kat
    
    try:
        cursor.execute("""
            INSERT INTO apartments 
            (id, block_id, unit_number, floor, unit_type, status, block_name, site_id, created_at)
            VALUES (%s, %s, %s, %s, '2+1', 'bos', 'C', '1', NOW())
        """, (apt_id, c_block_id, unit_number, floor))
        
        print(f"✓ Daire {unit_number} eklendi (Kat: {floor})")
    except Exception as e:
        print(f"✗ Daire {unit_number} eklenemedi: {e}")

conn.commit()
print("\n✓ C Blok'a 20 daire eklendi!")

cursor.close()
conn.close()
