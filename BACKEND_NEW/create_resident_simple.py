import mysql.connector
import uuid

# MySQL bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("Connected to MySQL database")

# Resident kullanıcısı oluştur
resident_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO users (id, email, password_hash, full_name, phone, site_id, status, email_verified, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
    ON DUPLICATE KEY UPDATE
    id = VALUES(id),
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    phone = VALUES(phone),
    status = VALUES(status)
""", (resident_id, 'resident1@test.com', 'password123', 'Ali Veli', '+905551112233', '1', 'aktif', True))

# Resident rolü ekle
cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_RESIDENT'")
resident_role = cursor.fetchone()
if resident_role:
    cursor.execute("""
        INSERT IGNORE INTO user_roles (user_id, role_id)
        VALUES (%s, %s)
    """, (resident_id, resident_role[0]))
    print(f"✓ Resident role added")

conn.commit()
print(f"✓ Resident user created: resident1@test.com / password123")
print(f"  User ID: {resident_id}")

cursor.close()
conn.close()
