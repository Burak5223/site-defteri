import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("USERS table structure:")
cursor.execute("DESCRIBE users")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

print("\nUSER_ROLES table structure:")
cursor.execute("DESCRIBE user_roles")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

cursor.close()
conn.close()
