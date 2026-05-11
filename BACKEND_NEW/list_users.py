import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT id, email, full_name, phone FROM users LIMIT 15")
users = cursor.fetchall()

print("=== SİSTEMDEKİ KULLANICILAR ===")
for u in users:
    print(f"{u['email']} - {u['full_name']} - {u['phone']}")

cursor.close()
conn.close()
