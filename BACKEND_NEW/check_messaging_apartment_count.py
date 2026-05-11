import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("MESAJLAŞMA SİSTEMİ DAİRE SAYISI KONTROLÜ")
print("=" * 80)

# Toplam daire sayısı (apartments tablosu)
cursor.execute("""
    SELECT COUNT(*) as total 
    FROM apartments 
    WHERE site_id = '1' AND is_deleted = 0
""")
total_apartments = cursor.fetchone()['total']
print(f"\nApartments tablosundaki toplam daire: {total_apartments}")

# apartment_messaging tablosundaki benzersiz daire sayısı
cursor.execute("""
    SELECT COUNT(DISTINCT apartment_id) as total 
    FROM apartment_messaging am
    JOIN apartments a ON am.apartment_id = a.id
    WHERE a.site_id = '1' AND a.is_deleted = 0
""")
messaging_apartments = cursor.fetchone()['total']
print(f"apartment_messaging'deki benzersiz daire: {messaging_apartments}")

# Fark
difference = total_apartments - messaging_apartments
print(f"\nFark: {difference} daire")

if difference > 0:
    print(f"\n{difference} daire apartment_messaging tablosunda eksik!")
    
    # Eksik daireleri bul
    cursor.execute("""
        SELECT a.id, a.unit_number, b.name as block_name
        FROM apartments a
        LEFT JOIN blocks b ON a.block_id = b.id
        WHERE a.site_id = '1' AND a.is_deleted = 0
        AND a.id NOT IN (
            SELECT DISTINCT apartment_id 
            FROM apartment_messaging
        )
        ORDER BY a.unit_number
    """)
    
    missing_apartments = cursor.fetchall()
    print(f"\nEksik daireler:")
    for apt in missing_apartments:
        print(f"  {apt['block_name']} - Daire {apt['unit_number']} (ID: {apt['id']})")
    
    # Bu dairelere sakin ekle
    print(f"\n" + "=" * 80)
    print("ÇÖZÜM: Eksik dairelere sakin ekleniyor...")
    print("=" * 80)
    
    for apt in missing_apartments:
        # Bu daireye ait kullanıcıları bul
        cursor.execute("""
            SELECT u.id, u.full_name, u.role
            FROM users u
            JOIN site_memberships sm ON u.id = sm.user_id
            WHERE sm.site_id = '1' 
            AND u.is_deleted = 0
            AND u.id NOT IN (
                SELECT user_id FROM apartment_messaging WHERE apartment_id = %s
            )
            LIMIT 1
        """, (apt['id'],))
        
        user = cursor.fetchone()
        
        if user:
            # apartment_messaging'e ekle
            cursor.execute("""
                INSERT INTO apartment_messaging (apartment_id, user_id, is_owner)
                VALUES (%s, %s, %s)
            """, (apt['id'], user['id'], True))
            
            print(f"✓ {apt['block_name']} - Daire {apt['unit_number']}: {user['full_name']} eklendi")
        else:
            print(f"✗ {apt['block_name']} - Daire {apt['unit_number']}: Uygun kullanıcı bulunamadı")
    
    conn.commit()
    
    # Son durumu kontrol et
    cursor.execute("""
        SELECT COUNT(DISTINCT apartment_id) as total 
        FROM apartment_messaging am
        JOIN apartments a ON am.apartment_id = a.id
        WHERE a.site_id = '1' AND a.is_deleted = 0
    """)
    new_messaging_apartments = cursor.fetchone()['total']
    
    print(f"\n" + "=" * 80)
    print("SON DURUM")
    print("=" * 80)
    print(f"Apartments tablosundaki toplam daire: {total_apartments}")
    print(f"apartment_messaging'deki benzersiz daire: {new_messaging_apartments}")
    print(f"Fark: {total_apartments - new_messaging_apartments}")
    print("=" * 80)
else:
    print("\n✓ Tüm daireler apartment_messaging tablosunda mevcut!")

cursor.close()
conn.close()
