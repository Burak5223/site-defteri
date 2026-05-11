import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

# Find admin users
cursor.execute("""
    SELECT u.id, u.email, u.full_name, u.password_hash, u.site_id, ur.role_name
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role_name IN ('ADMIN', 'ROLE_ADMIN', 'SUPER_ADMIN', 'ROLE_SUPER_ADMIN')
    AND u.site_id = '1'
    LIMIT 5
""")

results = cursor.fetchall()
print("=== ADMIN USERS FOR SITE 1 ===")
for row in results:
    print(f"ID: {row[0]}")
    print(f"Email: {row[1]}")
    print(f"Name: {row[2]}")
    print(f"Password Hash: {row[3][:50]}...")
    print(f"Site ID: {row[4]}")
    print(f"Role: {row[5]}")
    print()

cursor.close()
conn.close()
