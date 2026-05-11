import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()
cursor.execute("SHOW TABLES")
tables = cursor.fetchall()

print("=== TABLOLAR ===")
for table in tables:
    print(table[0])

cursor.close()
conn.close()
