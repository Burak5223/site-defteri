#!/usr/bin/env python3
"""
Verify all site admins for impersonate feature
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

print("=== All Site Admins for Impersonate ===\n")

# Get all sites
cursor.execute("SELECT id, name FROM sites WHERE is_deleted = 0 ORDER BY name")
sites = cursor.fetchall()

print(f"Total sites: {len(sites)}\n")
print("="*80)

for site in sites:
    site_id = site['id']
    site_name = site['name']
    
    print(f"\n{site_name} (ID: {site_id})")
    print("-" * 80)
    
    # Find admins with role_type='yonetici' in user_site_memberships
    cursor.execute("""
        SELECT 
            u.id,
            u.email,
            u.full_name,
            usm.role_type,
            usm.status
        FROM user_site_memberships usm
        INNER JOIN users u ON usm.user_id = u.id
        WHERE usm.site_id = %s 
        AND usm.role_type = 'yonetici'
        AND u.is_deleted = 0
        ORDER BY u.email
    """, (site_id,))
    
    admins = cursor.fetchall()
    
    if admins:
        print(f"✓ {len(admins)} admin(s) found:")
        for admin in admins:
            print(f"  • {admin['email']}")
            print(f"    Name: {admin['full_name']}")
            print(f"    Role Type: {admin['role_type']}")
            print(f"    Status: {admin['status']}")
    else:
        print("❌ NO ADMIN FOUND - Impersonate will fail!")

print("\n" + "="*80)
print("SUMMARY")
print("="*80 + "\n")

# Count sites with and without admins
cursor.execute("""
    SELECT 
        s.id,
        s.name,
        COUNT(usm.id) as admin_count
    FROM sites s
    LEFT JOIN user_site_memberships usm ON s.id = usm.site_id AND usm.role_type = 'yonetici'
    LEFT JOIN users u ON usm.user_id = u.id AND u.is_deleted = 0
    WHERE s.is_deleted = 0
    GROUP BY s.id, s.name
    ORDER BY s.name
""")

summary = cursor.fetchall()

sites_with_admin = 0
sites_without_admin = 0

for item in summary:
    if item['admin_count'] > 0:
        sites_with_admin += 1
        print(f"✓ {item['name']}: {item['admin_count']} admin(s)")
    else:
        sites_without_admin += 1
        print(f"❌ {item['name']}: NO ADMIN")

print(f"\nTotal: {sites_with_admin} sites with admin, {sites_without_admin} sites without admin")

if sites_without_admin == 0:
    print("\n✓ All sites have admins - Impersonate feature ready!")
else:
    print(f"\n⚠️  {sites_without_admin} site(s) need admin users")

cursor.close()
conn.close()
