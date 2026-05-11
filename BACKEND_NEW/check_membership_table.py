import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

cursor.execute("SHOW TABLES LIKE '%membership%'")
tables = cursor.fetchall()
print("Membership tabloları:")
for table in tables:
    print(f"  {list(table.values())[0]}")

if tables:
    table_name = list(tables[0].values())[0]
    cursor.execute(f"DESCRIBE {table_name}")
    print(f"\n{table_name} yapısı:")
    for col in cursor.fetchall():
        print(f"  {col['Field']}: {col['Type']}")

cursor.close()
conn.close()
