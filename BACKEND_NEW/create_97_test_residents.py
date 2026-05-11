#!/usr/bin/env python3
"""
97 kişilik test verisi oluşturma scripti
- Yeşil Vadi Sitesi için
- 3 blok (A, B, C)
- Her blokta 33 daire (toplam 99 daire, 97 dolu)
- Kat maliki ve kiracı karışık
"""
import mysql.connector
import uuid
import random 

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Türkçe isimler
first_names = [
    "Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Hasan", "İbrahim", "Yusuf", "Ömer", "Murat",
    "Ayşe", "Fatma", "Emine", "Hatice", "Zeynep", "Elif", "Meryem", "Şeyma", "Selin", "Deniz",
    "Burak", "Emre", "Can", "Cem", "Onur", "Serkan", "Tolga", "Volkan", "Kemal", "Okan",
    "Merve", "Esra", "Gizem", "Burcu", "Cansu", "Ebru", "Pınar", "Seda", "Tuğba", "Yasemin",
    "Barış", "Enes", "Furkan", "Kaan", "Oğuz", "Taner", "Umut", "Yasin", "Zafer", "Alper",
    "Aslı", "Begüm", "Ceren", "Damla", "Eda", "Fulya", "Gamze", "Hande", "İrem", "Jale"
]

last_names = [
    "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
    "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek",
    "Polat", "Erdoğan", "Güneş", "Aksoy", "Avcı", "Türk", "Çakır", "Özer", "Keskin", "Taş",
    "Karaca", "Bozkurt", "Güler", "Tekin", "Akın", "Bulut", "Aktaş", "Korkmaz", "Çiftçi", "Turan"
]

site_id = "1"  # Yeşil Vadi Sitesi

print("=" * 80)
print("97 KİŞİLİK TEST VERİSİ OLUŞTURMA")
print("=" * 80)

# Önce mevcut blokları kontrol et
cursor.execute("SELECT id, name FROM blocks WHERE site_id = %s", (site_id,))
existing_blocks = cursor.fetchall()

block_ids = {}
if existing_blocks:
    print(f"\nMevcut {len(existing_blocks)} blok bulundu:")
    for block in existing_blocks:
        block_ids[block['name']] = block['id']
        print(f"   {block['name']}: {block['id']}")
else:
    # Blokları oluştur
    print("\nBloklar olusturuluyor...")
    for block_name in ['A Blok', 'B Blok', 'C Blok']:
        block_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO blocks (id, site_id, name, total_floors, created_by)
            VALUES (%s, %s, %s, %s, %s)
        """, (block_id, site_id, block_name, 11, 'system'))
        block_ids[block_name] = block_id
        print(f"   {block_name} olusturuldu")

conn.commit()

# Daireleri ve sakinleri oluştur
print("\n97 sakin ve daire olusturuluyor...")

resident_count = 0
apartment_count = 0

for block_name, block_id in block_ids.items():
    print(f"\n{block_name}:")
    
    # Her blokta 33 daire (11 kat x 3 daire)
    for floor in range(1, 12):  # 1-11 arası katlar
        for unit in range(1, 4):  # Her katta 3 daire
            if resident_count >= 97:
                break
            
            # Daire numarası: Kat + Daire (örn: 101, 102, 103)
            unit_number = f"{floor}{unit:02d}"
            
            # Kullanıcı oluştur
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            full_name = f"{first_name} {last_name}"
            email = f"{first_name.lower()}.{last_name.lower()}{resident_count}@yesilvadi.com"
            
            # Rastgele şifre (hepsi aynı: "password123")
            password_hash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
            
            user_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (id, full_name, email, password_hash, status, email_verified, phone_verified)
                VALUES (%s, %s, %s, %s, 'aktif', TRUE, TRUE)
            """, (user_id, full_name, email, password_hash))
            
            # Daire oluştur
            apartment_id = str(uuid.uuid4())
            unit_type = random.choice(['2+1', '3+1', '4+1'])
            area = random.randint(80, 150)
            
            cursor.execute("""
                INSERT INTO apartments (id, block_id, site_id, unit_number, floor, unit_type, area, 
                                       current_resident_id, status, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'dolu', 'system')
            """, (apartment_id, block_id, site_id, unit_number, floor, unit_type, area, user_id))
            
            # User site membership ekle
            membership_id = str(uuid.uuid4())
            user_type = 'kat_maliki' if resident_count % 3 != 0 else 'kiraci'  # %70 kat maliki, %30 kiracı
            
            cursor.execute("""
                INSERT INTO user_site_memberships (id, user_id, site_id, role_type, user_type, status)
                VALUES (%s, %s, %s, 'sakin', %s, 'aktif')
            """, (membership_id, user_id, site_id, user_type))
            
            # Residency history ekle
            residency_id = str(uuid.uuid4())
            is_owner = (user_type == 'kat_maliki')
            
            cursor.execute("""
                INSERT INTO residency_history (id, apartment_id, user_id, is_owner, 
                                              move_in_date, status, created_by)
                VALUES (%s, %s, %s, %s, CURDATE(), 'active', 'system')
            """, (residency_id, apartment_id, user_id, is_owner))
            
            resident_count += 1
            apartment_count += 1
            
            if resident_count % 10 == 0:
                print(f"   {resident_count} sakin olusturuldu...")
        
        if resident_count >= 97:
            break

conn.commit()

print(f"\nToplam {resident_count} sakin olusturuldu")
print(f"Toplam {apartment_count} daire olusturuldu")

# Özet bilgi
print("\n" + "=" * 80)
print("OZET")
print("=" * 80)

cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(DISTINCT a.id) as apartment_count,
        COUNT(DISTINCT a.current_resident_id) as resident_count
    FROM blocks b
    LEFT JOIN apartments a ON b.id = a.block_id
    WHERE b.site_id = %s
    GROUP BY b.id, b.name
    ORDER BY b.name
""", (site_id,))

for row in cursor.fetchall():
    print(f"\n{row['block_name']}:")
    print(f"   Daire: {row['apartment_count']}")
    print(f"   Sakin: {row['resident_count']}")

# Kullanıcı tipi dağılımı
cursor.execute("""
    SELECT 
        user_type,
        COUNT(*) as count
    FROM user_site_memberships
    WHERE site_id = %s AND is_deleted = FALSE AND status = 'aktif'
    GROUP BY user_type
""", (site_id,))

print("\nKullanici Tipi Dagilimi:")
for row in cursor.fetchall():
    print(f"   {row['user_type']}: {row['count']} kisi")

print("\n" + "=" * 80)
print("ISLEM TAMAMLANDI!")
print("=" * 80)
print("\nTest Kullanici Bilgileri:")
print("Email: ahmet.yilmaz0@yesilvadi.com")
print("Sifre: password123")
print("\n(Tum kullanicilar icin sifre ayni: password123)")

cursor.close()
conn.close()
