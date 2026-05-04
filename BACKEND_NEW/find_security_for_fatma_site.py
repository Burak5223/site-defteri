#!/usr/bin/env python3
import mysql.connector
import uuid
from datetime import datetime

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

site_id = '69de5841-417e-47cc-93b6-693274fd4b7c'

cursor.execute("""
    SELECT id, full_name, email
    FROM users 
    WHERE site_id = %s
""", (site_id,))

users = cursor.fetchall()

print(f"All users in site {site_id}:")
for user in users:
    print(f"   - {user['email']} ({user['full_name']})")

security_users = [u for u in users if 'guvenlik' in u['email'].lower() or 'security' in u['email'].lower()]

if security_users:
    print(f"\n✅ Security users found:")
    for user in security_users:
        print(f"   - {user['email']} ({user['full_name']})")
else:
    print(f"\n❌ No security users found, creating one...")
    
    user_id = str(uuid.uuid4())
    phone = f"+9055{uuid.uuid4().hex[:8]}"
    
    cursor.execute("""
        INSERT INTO users (
            id, full_name, email, phone, site_id, password_hash,
            status, email_verified, phone_verified, created_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """, (
        user_id,
        'Güvenlik Görevlisi',
        'guvenlik@sehirmerkezi.com',
        phone,
        site_id,
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  # password: 123456
        'aktif',
        1,
        1,
        datetime.now()
    ))
    
    conn.commit()
    print(f"✅ Created security user: guvenlik@sehirmerkezi.com (password: 123456)")

conn.close()
