import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

cursor.execute("SELECT email, password_hash FROM users WHERE email = 'admin@site.com'")
result = cursor.fetchone()

if result:
    print(f"Email: {result[0]}")
    print(f"Password (hashed): {result[1][:50]}...")
else:
    print("Admin user not found")

cursor.close()
conn.close()
