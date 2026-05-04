import mysql.connector
import bcrypt

# Database bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=" * 80)
print("YEŞİL VADİ İÇİN TEMİZLİKÇİ KULLANICISI OLUŞTURULUYOR")
print("=" * 80)

# Önce temizlikçi kullanıcısı var mı kontrol et
cursor.execute("SELECT id, email, site_id FROM users WHERE email = 'temizlikci@site.com'")
existing = cursor.fetchone()

if existing:
    print(f"\n⚠️  Temizlikçi kullanıcısı zaten var!")
    print(f"   ID: {existing[0]}")
    print(f"   Email: {existing[1]}")
    print(f"   Site ID: {existing[2]}")
    
    # Site ID'yi güncelle
    cursor.execute("""
        UPDATE users 
        SET site_id = '1'
        WHERE email = 'temizlikci@site.com'
    """)
    
    # user_roles'u güncelle
    cursor.execute("""
        UPDATE user_roles ur
        JOIN users u ON ur.user_id = u.id
        SET ur.site_id = '1'
        WHERE u.email = 'temizlikci@site.com'
    """)
    
    conn.commit()
    print("\n✅ Site ID güncellendi: 1 (Yeşil Vadi)")
else:
    # Şifreyi hashle
    password = "temizlik123"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    hashed_str = hashed.decode('utf-8')
    
    # Kullanıcıyı oluştur
    user_id = "temizlikci-user-id"
    cursor.execute("""
        INSERT INTO users (id, email, password, full_name, phone, site_id, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
    """, (user_id, "temizlikci@site.com", hashed_str, "Temizlik Personeli", "+905551234567", "1"))
    
    # CLEANING rolünü bul
    cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_CLEANING'")
    role = cursor.fetchone()
    
    if not role:
        # CLEANING rolü yoksa oluştur
        cursor.execute("""
            INSERT INTO roles (id, name, description, created_at, updated_at)
            VALUES ('role-cleaning', 'ROLE_CLEANING', 'Temizlik Personeli', NOW(), NOW())
        """)
        role_id = "role-cleaning"
    else:
        role_id = role[0]
    
    # Rolü ata
    cursor.execute("""
        INSERT INTO user_roles (user_id, role_id, site_id)
        VALUES (%s, %s, %s)
    """, (user_id, role_id, "1"))
    
    conn.commit()
    
    print("\n✅ Temizlikçi kullanıcısı oluşturuldu!")
    print(f"   Email: temizlikci@site.com")
    print(f"   Şifre: {password}")
    print(f"   Site: Yeşil Vadi (ID: 1)")

# Tüm kullanıcıları göster
print("\n" + "=" * 80)
print("TÜM KULLANICILAR (YEŞİL VADİ)")
print("=" * 80)
cursor.execute("""
    SELECT u.email, u.full_name, u.site_id, s.name as site_name, r.name as role_name
    FROM users u
    LEFT JOIN sites s ON u.site_id = s.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.site_id = '1'
    ORDER BY u.email
""")
users = cursor.fetchall()

for user in users:
    print(f"{user[0]:30} -> {user[1]:25} | {user[4] or 'No Role'}")

print("=" * 80)

cursor.close()
conn.close()
