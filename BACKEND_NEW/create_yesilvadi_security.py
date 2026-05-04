import mysql.connector
import uuid
from datetime import datetime

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("YEŞİL VADİ SİTESİ GÜVENLİK KULLANICISI OLUŞTURMA")
print("=" * 80)

# 1. Yeşil Vadi sitesini bul
cursor.execute("SELECT id, name FROM sites WHERE id = '1' OR name LIKE '%Yeşil Vadi%'")
site = cursor.fetchone()
cursor.fetchall()  # Clear remaining results

if not site:
    print("❌ Yeşil Vadi sitesi bulunamadı!")
    exit(1)

print(f"\n✅ Site bulundu: {site['name']} (ID: {site['id']})")

# 2. SECURITY role'ünü bul
cursor.execute("SELECT id, name FROM roles WHERE name IN ('SECURITY', 'ROLE_SECURITY', 'Guvenlik')")
security_role = cursor.fetchone()
cursor.fetchall()  # Clear remaining results

if not security_role:
    print("❌ SECURITY rolü bulunamadı!")
    exit(1)

print(f"✅ Role bulundu: {security_role['name']} (ID: {security_role['id']})")

# 3. Güvenlik kullanıcısı oluştur
user_id = str(uuid.uuid4())
phone = "+905559876543"  # Yeşil Vadi güvenlik telefonu
password_hash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"  # "password123"
full_name = "Yeşil Vadi Güvenlik"
email = f"guvenlik.yesilvadi@sitedefteri.com"

print(f"\n📝 Yeni güvenlik kullanıcısı oluşturuluyor...")
print(f"   Phone: {phone}")
print(f"   Email: {email}")
print(f"   Site: {site['name']}")

cursor.execute("""
    INSERT INTO users (id, phone, email, full_name, password_hash, site_id, status, email_verified, phone_verified, created_at, updated_at)
    VALUES (%s, %s, %s, %s, %s, %s, 'aktif', 1, 1, NOW(), NOW())
""", (user_id, phone, email, full_name, password_hash, site['id']))

# 4. Role ata
user_role_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO user_roles (id, user_id, role_id, site_id, assigned_at, created_at, updated_at)
    VALUES (%s, %s, %s, %s, NOW(), NOW(), NOW())
""", (user_role_id, user_id, security_role['id'], site['id']))

conn.commit()

print(f"✅ Güvenlik kullanıcısı oluşturuldu!")
print(f"   User ID: {user_id}")
print(f"   Phone: {phone}")
print(f"   Password: password123")
print(f"   Site: {site['name']} (ID: {site['id']})")

# 5. Kontrol
cursor.execute("""
    SELECT u.id, u.phone, u.site_id, s.name as site_name, r.name as role
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN sites s ON u.site_id = s.id
    WHERE u.id = %s
""", (user_id,))

user_check = cursor.fetchone()
print(f"\n✅ Kontrol:")
print(f"   Phone: {user_check['phone']}")
print(f"   Site: {user_check['site_name']}")
print(f"   Role: {user_check['role']}")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("İŞLEM TAMAMLANDI")
print("=" * 80)
print("\nGiriş Bilgileri:")
print(f"Telefon: {phone}")
print("Şifre: password123")
