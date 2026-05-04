import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()
cursor.execute("SELECT id, email, full_name FROM users WHERE email LIKE 'super%'")

print("Super Admin users:")
for row in cursor.fetchall():
    print(f"ID: {row[0]}, Email: {row[1]}, Name: {row[2]}")

cursor.close()
conn.close()
