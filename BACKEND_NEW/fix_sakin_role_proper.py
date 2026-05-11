import mysql.connector
import uuid

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True, buffered=True)

print("=== SAKİN KULLANICI ROL DÜZELTMESİ ===\n")

# Get user ID
cursor.execute("SELECT id FROM users WHERE email = 'sakin@site.com'")
user = cursor.fetchone()

if not user:
    print("✗ Kullanıcı bulunamadı!")
    exit(1)

user_id = user['id']
print(f"User ID: {user_id}\n")

# Check if roles table exists and get RESIDENT role
cursor.execute("""
    SELECT id, name FROM roles WHERE name = 'ROLE_RESIDENT' OR name = 'RESIDENT'
""")
role = cursor.fetchone()

if not role:
    print("✗ RESIDENT rolü bulunamadı!")
    print("Rol oluşturuluyor...")
    
    role_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO roles (id, name, description)
        VALUES (%s, 'ROLE_RESIDENT', 'Resident user role')
    """, (role_id,))
    conn.commit()
    print(f"✓ ROLE_RESIDENT oluşturuldu: {role_id}")
else:
    role_id = role['id']
    print(f"✓ RESIDENT rolü bulundu: {role['name']} (ID: {role_id})")

# Check if user already has this role
cursor.execute("""
    SELECT * FROM user_roles 
    WHERE user_id = %s AND role_id = %s AND is_deleted = false
""", (user_id, role_id))

existing = cursor.fetchone()

if existing:
    print("\n✓ Kullanıcı zaten bu role sahip!")
else:
    print("\nKullanıcıya rol atanıyor...")
    user_role_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_roles (id, user_id, role_id, is_deleted)
        VALUES (%s, %s, %s, false)
    """, (user_role_id, user_id, role_id))
    conn.commit()
    print(f"✓ Rol atandı!")

# Verify
cursor.execute("""
    SELECT r.name 
    FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = %s AND ur.is_deleted = false
""", (user_id,))

roles = cursor.fetchall()
print(f"\n✓ Kullanıcının rolleri:")
for r in roles:
    print(f"  - {r['name']}")

cursor.close()
conn.close()

print("\n✓ İşlem tamamlandı!")
