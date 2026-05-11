#!/usr/bin/env python3
"""
Check what roleType values exist in user_site_memberships
"""
import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)

print("=== CHECKING USER_SITE_MEMBERSHIPS ===\n")

# Get all memberships for staff users
cursor.execute("""
    SELECT u.email, u.full_name, usm.role_type, usm.status
    FROM user_site_memberships usm
    JOIN users u ON usm.user_id = u.id
    WHERE u.email IN ('admin@site.com', 'guvenlik@site.com', 'temizlik@site.com')
    ORDER BY u.email
""")

memberships = cursor.fetchall()

print(f"Found {len(memberships)} membership records:\n")

for m in memberships:
    print(f"{m['email']} ({m['full_name']})")
    print(f"  role_type: '{m['role_type']}'")
    print(f"  status: '{m['status']}'\n")

# Get all unique role_type values
cursor.execute("SELECT DISTINCT role_type FROM user_site_memberships")
role_types = cursor.fetchall()

print("\n=== ALL UNIQUE ROLE_TYPE VALUES ===\n")
for rt in role_types:
    print(f"  - '{rt['role_type']}'")

cursor.close()
conn.close()
