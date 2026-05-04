import mysql.connector
import uuid

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# 1. Create SUPER_ADMIN role
print("1. Creating SUPER_ADMIN role...")
cursor.execute("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'")
role_result = cursor.fetchone()

if not role_result:
    role_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO roles (id, name, description, created_at)
        VALUES (%s, %s, %s, NOW())
    """, (role_id, 'SUPER_ADMIN', 'Tüm sitelere erişimi olan genel yönetici'))
    conn.commit()
    print(f"✓ SUPER_ADMIN role created with ID: {role_id}")
else:
    role_id = role_result[0]
    print(f"✓ SUPER_ADMIN role already exists with ID: {role_id}")

# 2. Create Super Admin user
print("\n2. Creating Super Admin user...")
cursor.execute("SELECT id FROM users WHERE email = 'superadmin@site.com'")
user_result = cursor.fetchone()

if not user_result:
    user_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, full_name, phone, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
    """, (user_id, 'superadmin@site.com', '123456', 'Super Admin', '+905559999999', 'aktif'))
    conn.commit()
    print(f"✓ Super Admin user created with ID: {user_id}")
else:
    user_id = user_result[0]
    print(f"✓ Super Admin user already exists with ID: {user_id}")

# 3. Assign SUPER_ADMIN role to user
print("\n3. Assigning SUPER_ADMIN role to user...")
cursor.execute("""
    SELECT 1 FROM user_roles WHERE user_id = %s AND role_id = %s
""", (user_id, role_id))

if not cursor.fetchone():
    cursor.execute("""
        INSERT INTO user_roles (user_id, role_id)
        VALUES (%s, %s)
    """, (user_id, role_id))
    conn.commit()
    print("✓ SUPER_ADMIN role assigned to user")
else:
    print("✓ User already has SUPER_ADMIN role")

# 4. Verify
print("\n4. Verification:")
cursor.execute("""
    SELECT u.id, u.email, u.full_name, u.status, r.name as role
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.email = 'superadmin@site.com'
""")

result = cursor.fetchone()
if result:
    print(f"✓ Super Admin verified:")
    print(f"  Email: {result[1]}")
    print(f"  Name: {result[2]}")
    print(f"  Status: {result[3]}")
    print(f"  Role: {result[4]}")
    print(f"\n✓ Login credentials:")
    print(f"  Email: superadmin@site.com")
    print(f"  Password: 123456")
else:
    print("✗ Verification failed!")

cursor.close()
conn.close()
