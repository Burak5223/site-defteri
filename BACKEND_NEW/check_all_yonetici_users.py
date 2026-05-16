#!/usr/bin/env python3
"""
Check ALL users with role_type='yonetici' in detail
"""
import mysql.connector
import os

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=os.getenv('DB_PASSWORD', 'Hilton5252.'),
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

print("=== ALL YONETICI USERS IN DATABASE ===\n")

# Get ALL users with role_type='yonetici'
cursor.execute("""
    SELECT 
        usm.id as membership_id,
        usm.user_id,
        usm.site_id,
        usm.role_type,
        u.email,
        u.full_name,
        s.name as site_name,
        u.is_deleted
    FROM user_site_memberships usm
    INNER JOIN users u ON usm.user_id = u.id
    INNER JOIN sites s ON usm.site_id = s.id
    WHERE usm.role_type = 'yonetici'
    ORDER BY s.name, u.email
""")

all_yonetici = cursor.fetchall()

print(f"Total 'yonetici' memberships: {len(all_yonetici)}\n")

current_site = None
site_count = {}

for row in all_yonetici:
    site_name = row['site_name']
    
    if site_name not in site_count:
        site_count[site_name] = 0
    site_count[site_name] += 1
    
    if site_name != current_site:
        current_site = site_name
        print(f"\n{site_name} (ID: {row['site_id']})")
        print("-" * 80)
    
    print(f"  {site_count[site_name]}. {row['email']}")
    print(f"     User ID: {row['user_id']}")
    print(f"     Membership ID: {row['membership_id']}")
    print(f"     Name: {row['full_name']}")
    print(f"     Is Deleted: {row['is_deleted']}")

print("\n" + "="*80)
print("SUMMARY BY SITE")
print("="*80 + "\n")

for site_name, count in sorted(site_count.items()):
    status = "✓" if count == 1 else f"❌ {count} admins"
    print(f"{site_name}: {status}")

cursor.close()
conn.close()
