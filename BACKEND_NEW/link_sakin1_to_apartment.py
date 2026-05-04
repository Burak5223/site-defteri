#!/usr/bin/env python3
import mysql.connector
from datetime import datetime

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Get sakin1 user
cursor.execute("SELECT id, site_id FROM users WHERE email = 'sakin1@şehirmerkeziresidence.com'")
user = cursor.fetchone()

if not user:
    print("❌ User not found!")
    exit(1)

user_id = user['id']
site_id = user['site_id']

print(f"✅ User: {user_id}")
print(f"   Site: {site_id}")

# Get an apartment from the same site
cursor.execute("""
    SELECT a.id, a.unit_number, b.name as block_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.site_id = %s
    LIMIT 1
""", (site_id,))

apartment = cursor.fetchone()

if not apartment:
    print("❌ No apartments found!")
    exit(1)

apartment_id = apartment['id']

print(f"✅ Apartment: {apartment['block_name']} - {apartment['unit_number']} ({apartment_id})")

# Link user to apartment
cursor.execute("""
    INSERT INTO residency_history (
        apartment_id, user_id, is_owner, move_in_date, status
    ) VALUES (%s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        is_owner = VALUES(is_owner),
        move_in_date = VALUES(move_in_date),
        status = VALUES(status)
""", (apartment_id, user_id, 1, datetime.now(), 'active'))

conn.commit()
conn.close()

print(f"✅ Linked user to apartment!")
