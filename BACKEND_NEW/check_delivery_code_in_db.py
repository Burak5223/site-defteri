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

print("\n=== RECENT NOTIFICATIONS WITH DELIVERY CODE ===")
cursor.execute("""
    SELECT id, full_name, delivery_code, status, created_at
    FROM resident_cargo_notifications
    WHERE delivery_code IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 5
""")
notifications = cursor.fetchall()
for n in notifications:
    print(f"Notification ID: {n[0]}, Name: {n[1]}, Code: {n[2]}, Status: {n[3]}")

print("\n=== RECENT PACKAGES WITH DELIVERY CODE ===")
cursor.execute("""
    SELECT id, recipient_name, delivery_code, status, matched_notification_id, recorded_at
    FROM packages
    WHERE delivery_code IS NOT NULL
    ORDER BY recorded_at DESC
    LIMIT 5
""")
packages = cursor.fetchall()
for p in packages:
    print(f"Package ID: {p[0]}, Name: {p[1]}, Code: {p[2]}, Status: {p[3]}, Notification: {p[4]}")

if not packages:
    print("No packages with delivery code found!")
    print("\n=== CHECKING RECENT MATCHED PACKAGES ===")
    cursor.execute("""
        SELECT p.id, p.recipient_name, p.delivery_code, p.status, p.matched_notification_id, n.delivery_code as notif_code
        FROM packages p
        LEFT JOIN resident_cargo_notifications n ON p.matched_notification_id = n.id
        WHERE p.matched_notification_id IS NOT NULL
        ORDER BY p.recorded_at DESC
        LIMIT 5
    """)
    matched = cursor.fetchall()
    for m in matched:
        print(f"Package ID: {m[0]}, Name: {m[1]}, Pkg Code: {m[2]}, Status: {m[3]}, Notif ID: {m[4]}, Notif Code: {m[5]}")

cursor.close()
conn.close()
