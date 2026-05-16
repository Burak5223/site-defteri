#!/usr/bin/env python3
import mysql.connector
import os

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor()

print("\n=== NOTIFICATION ID 68 ===")
cursor.execute("""
    SELECT id, full_name, delivery_code, cargo_company, expected_date, status, created_at
    FROM resident_cargo_notifications
    WHERE id = 68
""")
notif = cursor.fetchone()
if notif:
    print(f"ID: {notif[0]}")
    print(f"Name: {notif[1]}")
    print(f"Delivery Code: {notif[2]}")
    print(f"Cargo Company: {notif[3]}")
    print(f"Expected Date: {notif[4]}")
    print(f"Status: {notif[5]}")
    print(f"Created: {notif[6]}")
else:
    print("Notification not found")

print("\n=== ALL COLUMNS IN resident_cargo_notifications ===")
cursor.execute("DESCRIBE resident_cargo_notifications")
columns = cursor.fetchall()
for col in columns:
    print(f"  {col[0]} ({col[1]})")

cursor.close()
conn.close()
