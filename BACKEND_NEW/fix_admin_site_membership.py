import mysql.connector
import uuid

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

print("=== FIXING ADMIN SITE MEMBERSHIPS ===\n")

# Get all admin users
cursor.execute("""
    SELECT u.id, u.email, u.full_name, u.site_id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name IN ('ADMIN', 'ROLE_ADMIN')
    AND u.site_id IS NOT NULL
""")

admin_users = cursor.fetchall()

for user_id, email, full_name, site_id in admin_users:
    print(f"Processing: {email} (Site: {site_id})")
    
    # Check if site_membership exists
    cursor.execute("""
        SELECT id FROM site_memberships 
        WHERE user_id = %s AND site_id = %s
    """, (user_id, site_id))
    
    existing = cursor.fetchone()
    
    if existing:
        print(f"  ✓ Site membership already exists")
    else:
        # Create site membership
        membership_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO site_memberships (id, user_id, site_id, joined_at)
            VALUES (%s, %s, %s, NOW())
        """, (membership_id, user_id, site_id))
        print(f"  ✓ Created site membership")
    
    print()

conn.commit()

print("\n=== VERIFICATION ===\n")

# Verify all admin users have site memberships
cursor.execute("""
    SELECT u.email, u.site_id, sm.id as membership_id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN site_memberships sm ON u.id = sm.user_id AND u.site_id = sm.site_id
    WHERE r.name IN ('ADMIN', 'ROLE_ADMIN')
    AND u.site_id IS NOT NULL
""")

results = cursor.fetchall()
for email, site_id, membership_id in results:
    status = "✓" if membership_id else "✗"
    print(f"{status} {email} - Site: {site_id}, Membership: {membership_id}")

cursor.close()
conn.close()

print("\n=== DONE ===")
