#!/usr/bin/env python3
"""Check voting table names"""

import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

cursor.execute("SHOW TABLES LIKE '%vot%'")
tables = cursor.fetchall()

print("Tables with 'vot' in name:")
for table in tables:
    print(f"  - {table[0]}")

cursor.close()
conn.close()
