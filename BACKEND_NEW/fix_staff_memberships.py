import mysql.connector
import uuid
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== FIXING STAFF USER SITE MEMBERSHIPS ===\n")

# Users that need membership
users_to_fix = [
    {
        'email': 'admin@site.com',
        'id': '69f6dde2-4927-420a-aa3b-e9226f5cfdbe',
        'role_type': 'ROLE_ADMIN'
    },
    {
        'email': 'guvenlik@site.com',
        'id': '6ada23be-a12f-4f95-ae0b-212d3b86582d',
        'role_type': 'ROLE_SECURITY'
    },
    {
        'email': 'temizlik@site.com',
        'id': '86338259-9ca3-45ed-a789-c31dc70713d6',
        'role_type': 'ROLE_CLEANING'
    }
]

site_id = '1'
now = datetime.now()

for user in users_to_fix:
    # Check if membership already exists
    cursor.execute("""
        SELECT id FROM user_site_memberships 
        WHERE user_id = %s AND site_id = %s
    """, (user['id'], site_id))
    
    existing = cursor.fetchone()
    
    if existing:
        print(f"✓ {user['email']} already has membership")
        continue
    
    # Create membership
    membership_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_site_memberships 
        (id, user_id, site_id, role_type, user_type, status, joined_at, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        membership_id,
        user['id'],
        site_id,
        user['role_type'],
        'personel',  # All staff are 'personel' type
        'aktif',     # Status must be 'aktif' not 'active'
        now,
        now,
        now
    ))
    
    print(f"✓ Created membership for {user['email']} with role {user['role_type']}")

conn.commit()

# Verify
print("\n=== VERIFICATION ===")
cursor.execute("""
    SELECT 
        u.email,
        usm.role_type,
        usm.status
    FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE u.email IN ('admin@site.com', 'guvenlik@site.com', 'temizlik@site.com')
    AND usm.site_id = '1'
""")

results = cursor.fetchall()
for row in results:
    print(f"✓ {row['email']:30s} | Role: {row['role_type']:20s} | Status: {row['status']}")

cursor.close()
conn.close()

print("\n✓ Fix completed! All staff users now have site memberships.")
