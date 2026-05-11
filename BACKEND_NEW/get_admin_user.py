import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Admin kullanıcısı bul
cursor.execute("""
    SELECT u.id, u.full_name, u.email, u.phone, u.password_hash
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'ADMIN' AND u.site_id = '1' AND u.is_deleted = 0
    LIMIT 1
""")

admin = cursor.fetchone()
if admin:
    print(f"Admin User:")
    print(f"  Email: {admin['email']}")
    print(f"  Phone: {admin['phone']}")
    print(f"  Name: {admin['full_name']}")
    print(f"  Password hash: {admin['password_hash'][:50]}...")
else:
    print("No admin found, trying any user...")
    cursor.execute("""
        SELECT id, full_name, email, phone
        FROM users
        WHERE site_id = '1' AND is_deleted = 0
        LIMIT 1
    """)
    user = cursor.fetchone()
    if user:
        print(f"User:")
        print(f"  Email: {user['email']}")
        print(f"  Phone: {user['phone']}")

cursor.close()
conn.close()
