import mysql.connector

# Database bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== Site 1 için Test Verisi Oluşturma ===\n")

# Site 1'in var olup olmadığını kontrol et
cursor.execute("SELECT id, name FROM sites WHERE id = '1'")
site1 = cursor.fetchone()

if not site1:
    print("Site 1 bulunamadı, oluşturuluyor...")
    cursor.execute("""
        INSERT INTO sites (id, name, address, total_apartments, created_at, updated_at)
        VALUES ('1', 'Yeşil Vadi Sitesi', 'Ankara, Çankaya', 120, NOW(), NOW())
    """)
    conn.commit()
    print("✅ Site 1 oluşturuldu: Yeşil Vadi Sitesi")
else:
    print(f"✅ Site 1 zaten mevcut: {site1[1]}")

# Site 1 için blok oluştur
cursor.execute("SELECT COUNT(*) FROM blocks WHERE site_id = '1'")
block_count = cursor.fetchone()[0]

if block_count == 0:
    print("\nSite 1 için bloklar oluşturuluyor...")
    blocks = [
        ('A Blok', 5),
        ('B Blok', 5),
        ('C Blok', 4),
    ]
    
    for block_name, floors in blocks:
        cursor.execute("""
            INSERT INTO blocks (site_id, name, total_floors, created_at, updated_at)
            VALUES ('1', %s, %s, NOW(), NOW())
        """, (block_name, floors))
    
    conn.commit()
    print(f"✅ {len(blocks)} blok oluşturuldu")
else:
    print(f"\n✅ Site 1'de zaten {block_count} blok var")

# Site 1 için daireler oluştur
cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id = '1'")
apartment_count = cursor.fetchone()[0]

if apartment_count == 0:
    print("\nSite 1 için daireler oluşturuluyor...")
    
    # Blokları al
    cursor.execute("SELECT id, name, total_floors FROM blocks WHERE site_id = '1'")
    blocks = cursor.fetchall()
    
    apartment_count = 0
    for block_id, block_name, total_floors in blocks:
        for floor in range(1, total_floors + 1):
            for door in range(1, 5):  # Her katta 4 daire
                unit_number = f"{floor}{door}"
                cursor.execute("""
                    INSERT INTO apartments (site_id, block_id, unit_number, floor, status, created_at, updated_at)
                    VALUES ('1', %s, %s, %s, 'bos', NOW(), NOW())
                """, (block_id, unit_number, floor))
                apartment_count += 1
    
    conn.commit()
    print(f"✅ {apartment_count} daire oluşturuldu")
else:
    print(f"\n✅ Site 1'de zaten {apartment_count} daire var")

# Özet
print("\n=== Özet ===")
cursor.execute("SELECT COUNT(*) FROM blocks WHERE site_id = '1'")
print(f"Blok sayısı: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id = '1'")
print(f"Daire sayısı: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM users WHERE site_id = '1'")
print(f"Kullanıcı sayısı: {cursor.fetchone()[0]}")

cursor.close()
conn.close()

print("\n✅ Site 1 için test verisi hazır!")
print("\nŞimdi mobil uygulamayı yenile, Site ID 1 ile çalışacak!")
