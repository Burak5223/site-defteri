import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== USER_ROLES TABLE STRUCTURE ===")
cursor.execute("DESCRIBE user_roles")
for row in cursor.fetchall():
    print(row)

print("\n=== SAMPLE DATA FROM USER_ROLES ===")
cursor.execute("SELECT * FROM user_roles LIMIT 5")
for row in cursor.fetchall():
    print(row)

cursor.close()
conn.close()
