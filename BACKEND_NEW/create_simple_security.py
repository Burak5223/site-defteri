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

print("YEŞİL VADİ GÜVENLİK KULLANICISI OLUŞTURMA")
print("=" * 80)

# Şifre hash'i oluştur
password = "guvenlik123"
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

user_id = str(uuid.uuid4())
email = "guvenlik@yesilvadi.com"
phone = "+905551112233"
full_name = "Yeşil Vadi Güvenlik"
site_id = "1"

print(f"Email: {email}")
print(f"Phone: {phone}")
print(f"Password: {password}")
print(f"Site: Yeşil Vadi (ID: {site_id})")

# Kullanıcı oluştur
cursor.execute("""
    INSERT INTO users (id, email, phone, full_name, password_hash, site_id, status, email_verified, phone_verified)
    VALUES (%s, %s, %s, %s, %s, %s, 'aktif', 1, 1)
""", (user_id, email, phone, full_name, password_hash, site_id))

# Role ata
cursor.execute("SELECT id FROM roles WHERE name IN ('ROLE_SECURITY', 'Guvenlik') LIMIT 1")
role = cursor.fetchone()
cursor.fetchall()

user_role_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO user_roles (id, user_id, role_id, site_id)
    VALUES (%s, %s, %s, %s)
""", (user_role_id, user_id, role['id'], site_id))

conn.commit()

print(f"\n✅ Güvenlik kullanıcısı oluşturuldu!")
print(f"\nGiriş Bilgileri:")
print(f"Email: {email}")
print(f"Şifre: {password}")

cursor.close()
conn.close()
