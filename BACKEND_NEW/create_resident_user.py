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

# Resident için apartment oluştur veya bul
cursor.execute("SELECT id FROM apartments WHERE site_id = '1' LIMIT 1")
apartment = cursor.fetchone()
if apartment:
    apartment_id = apartment[0]
else:
    apartment_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO apartments (id, site_id, block_id, unit_number, floor, type, area, status, created_at)
        VALUES (%s, %s, NULL, %s, %s, %s, %s, %s, NOW())
    """, (apartment_id, '1', 'A-12', 1, 'APARTMENT', 100.0, 'OCCUPIED'))

# Residency oluştur
cursor.execute("""
    INSERT INTO residencies (id, user_id, apartment_id, site_id, start_date, is_owner, is_active, created_at)
    VALUES (%s, %s, %s, %s, NOW(), %s, %s, NOW())
    ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active)
""", (str(uuid.uuid4()), resident_id, apartment_id, '1', True, True))

conn.commit()
print(f"✓ Resident user created: resident1@test.com / password123")
print(f"  User ID: {resident_id}")
print(f"  Apartment ID: {apartment_id}")

cursor.close()
conn.close()
