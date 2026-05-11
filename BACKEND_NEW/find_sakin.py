import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT id, email, full_name, phone FROM users WHERE email LIKE '%sakin%' OR full_name LIKE '%Sakin%'")
users = cursor.fetchall()

print("=== 'SAKIN' KULLANICILAR ===")
for u in users:
    print(f"{u['email']} - {u['full_name']} - {u['phone']}")

print("\n=== A BLOK 12 NUMARALI DAİRE KULLANICILARI ===")
cursor.execute("""
    SELECT u.id, u.email, u.full_name, u.phone,
           a.apartment_number, b.name as block_name
    FROM users u
    JOIN residency_history rh ON u.id = rh.user_id
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'A Blok' AND a.apartment_number = '12' AND rh.end_date IS NULL
""")
apt_users = cursor.fetchall()

for u in apt_users:
    print(f"{u['email']} - {u['full_name']} - {u['block_name']} {u['apartment_number']}")

cursor.close()
conn.close()
