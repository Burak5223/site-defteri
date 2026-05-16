#!/usr/bin/env python3
import mysql.connector

connection = mysql.connector.connect(
    host='localhost',
    database='smart_site_management',
    user='root',
    password='Hilton5252.'
)

cursor = connection.cursor()

print("=== user_roles table structure ===\n")
cursor.execute("SHOW COLUMNS FROM user_roles")
for col in cursor.fetchall():
    print(f"{col[0]}: {col[1]}")

print("\n=== Sample data ===\n")
cursor.execute("SELECT * FROM user_roles LIMIT 3")
columns = [desc[0] for desc in cursor.description]
print("Columns:", columns)

for row in cursor.fetchall():
    print(row)

cursor.close()
connection.close()
