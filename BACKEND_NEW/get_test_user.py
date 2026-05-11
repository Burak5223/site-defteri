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

# Site 1'den bir kullanıcı al
cursor.execute("""
    SELECT id, full_name, email, phone
    FROM users
    WHERE site_id = '1' AND is_deleted = 0
    LIMIT 1
""")

user = cursor.fetchone()
if user:
    print(f"Test Kullanıcısı:")
    print(f"  ID: {user['id']}")
    print(f"  İsim: {user['full_name']}")
    print(f"  Email: {user['email']}")
    print(f"  Telefon: {user['phone']}")

cursor.close()
conn.close()
