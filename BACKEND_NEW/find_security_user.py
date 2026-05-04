import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()
cursor.execute("SELECT email, full_name FROM users WHERE email LIKE '%guvenlik%' OR email LIKE '%security%' LIMIT 5")

print("Security users:")
for row in cursor.fetchall():
    print(f"  {row[0]} - {row[1]}")

conn.close()
