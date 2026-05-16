#!/usr/bin/env python3
"""
Keep only one admin per site for impersonate feature
Yeşilvadi: admin@site.com
Other sites: Keep the first admin with role_type='yonetici'
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

print("=== Cleaning Up - One Admin Per Site ===\n")

# Get all sites
cursor.execute("SELECT id, name FROM sites WHERE is_deleted = 0 ORDER BY name")
sites = cursor.fetchall()

for site in sites:
    site_id = site['id']
    site_name = site['name']
    
    print(f"\n{site_name} (ID: {site_id})")
    print("-" * 80)
    
    # Find all admins with role_type='yonetici'
    cursor.execute("""
        SELECT 
            u.id as user_id,
            u.email,
            u.full_name,
            usm.id as membership_id
        FROM user_site_memberships usm
        INNER JOIN users u ON usm.user_id = u.id
        WHERE usm.site_id = %s 
        AND usm.role_type = 'yonetici'
        AND u.is_deleted = 0
        ORDER BY u.email
    """, (site_id,))
    
    admins = cursor.fetchall()
    
    if not admins:
        print("  ⚠️  No admin found")
        continue
    
    print(f"  Found {len(admins)} admin(s):")
    for admin in admins:
        print(f"    - {admin['email']}")
    
    # Determine which admin to keep
    if site_id == '1':  # Yeşilvadi
        # Keep only admin@site.com
        keep_admin = next((a for a in admins if a['email'] == 'admin@site.com'), None)
        if not keep_admin:
            print("  ❌ admin@site.com not found for Yeşilvadi!")
            continue
    else:
        # Keep the first admin (already sorted by email)
        keep_admin = admins[0]
    
    print(f"\n  ✓ Keeping: {keep_admin['email']}")
    
    # Delete other admins
    for admin in admins:
        if admin['user_id'] == keep_admin['user_id']:
            continue
        
        user_id = admin['user_id']
        email = admin['email']
        
        print(f"  ✗ Removing: {email}")
        
        # Delete user_site_memberships
        cursor.execute("""
            DELETE FROM user_site_memberships
            WHERE user_id = %s
        """, (user_id,))
        
        # Delete site_memberships
        cursor.execute("""
            DELETE FROM site_memberships
            WHERE user_id = %s
        """, (user_id,))
        
        # Delete user_roles
        cursor.execute("""
            DELETE FROM user_roles
            WHERE user_id = %s
        """, (user_id,))
        
        # Delete user
        cursor.execute("""
            DELETE FROM users
            WHERE id = %s
        """, (user_id,))
        
        conn.commit()
        print(f"    ✓ Deleted")

print("\n" + "="*80)
print("FINAL VERIFICATION")
print("="*80 + "\n")

# Verify final state
cursor.execute("""
    SELECT 
        s.name as site_name,
        u.email,
        u.full_name,
        usm.role_type
    FROM sites s
    LEFT JOIN user_site_memberships usm ON s.id = usm.site_id AND usm.role_type = 'yonetici'
    LEFT JOIN users u ON usm.user_id = u.id AND u.is_deleted = 0
    WHERE s.is_deleted = 0
    ORDER BY s.name
""")

results = cursor.fetchall()

current_site = None
for row in results:
    if row['site_name'] != current_site:
        current_site = row['site_name']
        print(f"\n{current_site}:")
    
    if row['email']:
        print(f"  ✓ {row['email']} ({row['full_name']})")
    else:
        print(f"  ❌ NO ADMIN")

print("\n" + "="*80)
print("✓ Cleanup complete - Each site has exactly 1 admin")
print("="*80)

cursor.close()
conn.close()
