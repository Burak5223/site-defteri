import mysql.connector
import uuid
import bcrypt

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("MEVCUT KULLANICIYI GÜVENLİK OLARAK GÜNCELLEME")
print("=" * 80)

# Mevcut kullanıcıyı bul
phone = "+905551112233"
cursor.execute("SELECT id, email, phone, site_id FROM users WHERE phone = %s", (phone,))
user = cursor.fetchone()
cursor.fetchall()

if not user:
    print(f"❌ {phone} telefon numaralı kullanıcı bulunamadı!")
    exit(1)

print(f"\n✅ Kullanıcı bulundu:")
print(f"   ID: {user['id']}")
print(f"   Email: {user['email']}")
print(f"   Phone: {user['phone']}")
print(f"   Site ID: {user['site_id']}")

# Şifre güncelle
password = "guvenlik123"
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

cursor.execute("""
    UPDATE users
    SET password_hash = %s, site_id = '1', full_name = 'Yeşil Vadi Güvenlik', status = 'aktif'
    WHERE id = %s
""", (password_hash, user['id']))

# Mevcut rolleri sil
cursor.execute("DELETE FROM user_roles WHERE user_id = %s", (user['id'],))

# Güvenlik rolü ata
cursor.execute("SELECT id FROM roles WHERE name IN ('ROLE_SECURITY', 'Guvenlik') LIMIT 1")
role = cursor.fetchone()
cursor.fetchall()

user_role_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO user_roles (id, user_id, role_id, site_id)
    VALUES (%s, %s, %s, '1')
""", (user_role_id, user['id'], role['id']))

conn.commit()

print(f"\n✅ Kullanıcı güncellendi!")
print(f"\nGiriş Bilgileri:")
print(f"Email: {user['email']}")
print(f"Şifre: {password}")
print(f"Site: Yeşil Vadi Sitesi")

cursor.close()
conn.close()
