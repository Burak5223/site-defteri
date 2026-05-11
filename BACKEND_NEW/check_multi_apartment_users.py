#!/usr/bin/env python3
"""
Check which users have multiple apartments
"""
import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="1234",
    database="smart_site_management"
)

cursor = conn.cursor()

# Find users with multiple apartments
query = """
SELECT 
    u.id,
    u.full_name,
    u.email,
    COUNT(DISTINCT rh.apartment_id) as apartment_count,
    GROUP_CONCAT(CONCAT(b.name, ' - ', a.unit_number) SEPARATOR ', ') as apartments
FROM users u
JOIN residency_history rh ON u.id = rh.user_id
JOIN apartments a ON rh.apartment_id = a.id
JOIN blocks b ON a.block_id = b.id
WHERE rh.status = 'active' AND rh.is_deleted = FALSE
GROUP BY u.id, u.full_name, u.email
HAVING apartment_count > 1
ORDER BY apartment_count DESC
LIMIT 10
"""

cursor.execute(query)
results = cursor.fetchall()

print("=" * 80)
print("USERS WITH MULTIPLE APARTMENTS")
print("=" * 80)

if results:
    for row in results:
        user_id, full_name, email, apt_count, apartments = row
        print(f"\n👤 {full_name} ({email})")
        print(f"   ID: {user_id}")
        print(f"   Apartments ({apt_count}): {apartments}")
else:
    print("\n⚠️  No users found with multiple apartments")
    print("   All users have only 1 apartment each")

cursor.close()
conn.close()

print("\n" + "=" * 80)
