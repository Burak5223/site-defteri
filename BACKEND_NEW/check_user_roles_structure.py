import mysql.connector

def connect_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )

conn = connect_db()
cursor = conn.cursor(dictionary=True)

print("=== USER_ROLES TABLOSU ===\n")
cursor.execute("DESCRIBE user_roles")
columns = cursor.fetchall()
for col in columns:
    print(f"  {col['Field']}: {col['Type']}")

print("\n=== ÖRNEK KAYITLAR ===\n")
cursor.execute("SELECT * FROM user_roles LIMIT 5")
rows = cursor.fetchall()
for row in rows:
    print(row)

print("\n=== USERS TABLOSUNDA ROLE KOLONU ===\n")
cursor.execute("SELECT DISTINCT role FROM users WHERE role IS NOT NULL LIMIT 10")
roles = cursor.fetchall()
for role in roles:
    print(f"  - {role['role']}")

cursor.close()
conn.close()
