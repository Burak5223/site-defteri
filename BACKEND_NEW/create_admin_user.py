import mysql.connector
import bcrypt
import uuid
import random

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Yeşil Vadi Sitesi ID'sini bul
cursor.execute("SELECT id, name FROM sites WHERE name LIKE %s OR id = %s", ('%yeşil%vadi%', '1'))
site = cursor.fetchone()

if not site:
    print("❌ Yeşil Vadi Sitesi bulunamadı!")
    conn.close()
    exit(1)

site_id = site['id']
site_name = site['name']
print(f"✓ Site bulundu: {site_name} (ID: {site_id})")

# Admin rolünü bul
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_ADMIN'")
admin_role = cursor.fetchone()
if not admin_role:
    print("❌ ROLE_ADMIN bulunamadı!")
    conn.close()
    exit(1)

admin_role_id = admin_role['id']
print(f"✓ Admin rolü bulundu (ID: {admin_role_id})")

# Kullanıcı zaten var mı kontrol et
cursor.execute("SELECT id FROM users WHERE email = %s", ('admin@site.com',))
existing = cursor.fetchone()

if existing:
    print(f"⚠️  admin@site.com zaten mevcut (ID: {existing['id']})")
    print("Şifreyi güncelliyorum...")
    
    # Şifreyi güncelle
    password = "admin123"
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (hashed, 'admin@site.com'))
    conn.commit()
    
    user_id = existing['id']
    print(f"✓ Şifre güncellendi: admin123")
else:
    # Yeni kullanıcı oluştur
    user_id = str(uuid.uuid4())
    password = "admin123"
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    # Rastgele telefon numarası oluştur
    phone = f"+9055{random.randint(10000000, 99999999)}"
    
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, full_name, phone, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
    """, (user_id, 'admin@site.com', hashed, 'Site Yöneticisi', phone, 'aktif'))
    
    conn.commit()
    print(f"✓ Kullanıcı oluşturuldu (ID: {user_id})")

# Site üyeliğini kontrol et
cursor.execute("""
    SELECT id FROM user_site_memberships 
    WHERE user_id = %s AND site_id = %s
""", (user_id, site_id))

membership = cursor.fetchone()

if not membership:
    # Site üyeliği ekle
    membership_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_site_memberships (id, user_id, site_id, role_type, joined_at)
        VALUES (%s, %s, %s, %s, NOW())
    """, (membership_id, user_id, site_id, 'ADMIN'))
    
    conn.commit()
    print(f"✓ Site üyeliği eklendi: {site_name}")
else:
    print(f"✓ Site üyeliği zaten mevcut")

# Rol atamasını kontrol et
cursor.execute("""
    SELECT id FROM user_roles 
    WHERE user_id = %s AND role_id = %s
""", (user_id, admin_role_id))

role_assignment = cursor.fetchone()

if not role_assignment:
    # Rol ataması ekle
    role_assignment_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_roles (id, user_id, role_id, assigned_at)
        VALUES (%s, %s, %s, NOW())
    """, (role_assignment_id, user_id, admin_role_id))
    
    conn.commit()
    print(f"✓ ADMIN rolü atandı")
else:
    print(f"✓ ADMIN rolü zaten atanmış")

print("\n=== ÖZET ===")
print(f"Email: admin@site.com")
print(f"Şifre: admin123")
print(f"Site: {site_name}")
print(f"Rol: ADMIN")
print(f"User ID: {user_id}")

conn.close()
