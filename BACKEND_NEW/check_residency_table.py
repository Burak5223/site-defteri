#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Check residency_history table structure
"""

import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("Residency_history table structure:")
cursor.execute("DESCRIBE residency_history")
columns = cursor.fetchall()

for col in columns:
    print(f"  {col['Field']}: {col['Type']} {col['Null']} {col['Key']} {col['Default']}")

print("\nSample data:")
cursor.execute("SELECT * FROM residency_history LIMIT 3")
rows = cursor.fetchall()

for row in rows:
    print(f"\n{row}")

cursor.close()
conn.close()
