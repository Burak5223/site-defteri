import mysql.connector

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== FIXING BLOCK NAME CONSISTENCY ===\n")

# 1. "A", "B", "C" olan block_name'leri "A Blok", "B Blok", "C Blok" yap
updates = [
    ("A", "A Blok"),
    ("B", "B Blok"),
    ("C", "C Blok")
]

for old_name, new_name in updates:
    # Kaç daire etkilenecek kontrol et
    cursor.execute("""
        SELECT COUNT(*) 
        FROM apartments 
        WHERE block_name = %s
    """, (old_name,))
    
    count = cursor.fetchone()[0]
    
    if count > 0:
        # Güncelle
        cursor.execute("""
            UPDATE apartments 
            SET block_name = %s 
            WHERE block_name = %s
        """, (new_name, old_name))
        
        conn.commit()
        print(f"✓ Updated {count} apartments: '{old_name}' → '{new_name}'")
    else:
        print(f"  No apartments with block_name '{old_name}'")

# 2. Sonuçları kontrol et
cursor.execute("""
    SELECT DISTINCT block_name, COUNT(*) as count
    FROM apartments
    WHERE block_name IS NOT NULL
    AND block_name != 'None'
    GROUP BY block_name
    ORDER BY block_name
""")

block_names = cursor.fetchall()

print("\n=== CURRENT BLOCK NAMES ===")
for block_name, count in block_names:
    print(f"  {block_name}: {count} apartments")

# 3. Blok bazında sakin dağılımı
cursor.execute("""
    SELECT 
        a.block_name,
        COUNT(DISTINCT a.current_resident_id) as residents
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = '1'
    AND a.block_name IS NOT NULL
    AND a.block_name != 'None'
    AND a.current_resident_id IS NOT NULL
    GROUP BY a.block_name
    ORDER BY a.block_name
""")

distribution = cursor.fetchall()

print("\n=== RESIDENTS BY BLOCK ===")
total_residents = 0
for block_name, residents in distribution:
    print(f"  {block_name}: {residents} residents")
    total_residents += residents

print(f"\nTotal: {total_residents} residents")

cursor.close()
conn.close()

print("\n=== DONE ===")
