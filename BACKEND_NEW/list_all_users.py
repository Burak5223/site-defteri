import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

cursor.execute("""
    SELECT id, email, full_name, role, site_id 
    FROM users 
    WHERE role IN ('ADMIN', 'ROLE_ADMIN', 'SUPER_ADMIN', 'ROLE_SUPER_ADMIN')
    LIMIT 10
""")

results = cursor.fetchall()
print("=== ADMIN USERS ===")
for row in results:
    print(f"ID: {row[0]}")
    print(f"Email: {row[1]}")
    print(f"Name: {row[2]}")
    print(f"Role: {row[3]}")
    print(f"Site ID: {row[4]}")
    print()

cursor.close()
conn.close()
