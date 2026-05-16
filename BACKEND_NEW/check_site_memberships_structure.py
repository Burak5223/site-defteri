#!/usr/bin/env python3
"""
Check site_memberships table structure
"""
import mysql.connector
import os

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor()

# Check table structure
cursor.execute("DESCRIBE site_memberships")
columns = cursor.fetchall()

print("=== site_memberships table structure ===")
for col in columns:
    print(f"{col[0]}: {col[1]}")

cursor.close()
conn.close()
