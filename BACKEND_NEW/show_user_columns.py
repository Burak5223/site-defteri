import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()
cursor.execute("DESCRIBE users")
columns = cursor.fetchall()

print("=== USERS TABLOSU KOLONLARI ===")
for col in columns:
    print(f"{col[0]} - {col[1]}")

cursor.close()
conn.close()
