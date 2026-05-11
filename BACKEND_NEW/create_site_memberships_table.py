import mysql.connector
import uuid

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

print("=== CREATING SITE_MEMBERSHIPS TABLE ===\n")

# Create site_memberships table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS site_memberships (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id CHAR(36) NOT NULL,
        site_id CHAR(36) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (site_id) REFERENCES sites(id),
        UNIQUE KEY unique_user_site (user_id, site_id)
    )
""")

print("✓ Table created\n")

print("=== ADDING SITE MEMBERSHIPS FOR ALL USERS WITH SITE_ID ===\n")

# Get all users with site_id
cursor.execute("""
    SELECT id, email, full_name, site_id
    FROM users
    WHERE site_id IS NOT NULL
""")

users = cursor.fetchall()
added_count = 0

for user_id, email, full_name, site_id in users:
    # Check if membership exists
    cursor.execute("""
        SELECT id FROM site_memberships 
        WHERE user_id = %s AND site_id = %s
    """, (user_id, site_id))
    
    if not cursor.fetchone():
        # Create membership
        membership_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO site_memberships (id, user_id, site_id, joined_at, is_active)
            VALUES (%s, %s, %s, NOW(), 1)
        """, (membership_id, user_id, site_id))
        added_count += 1
        print(f"✓ Added membership for {email} to site {site_id}")

conn.commit()

print(f"\n=== SUMMARY ===")
print(f"Total users with site_id: {len(users)}")
print(f"New memberships created: {added_count}")

print("\n=== VERIFICATION ===\n")

# Count memberships
cursor.execute("SELECT COUNT(*) FROM site_memberships")
total = cursor.fetchone()[0]
print(f"Total site memberships: {total}")

# Show sample memberships
cursor.execute("""
    SELECT u.email, s.name as site_name, sm.joined_at
    FROM site_memberships sm
    JOIN users u ON sm.user_id = u.id
    JOIN sites s ON sm.site_id = s.id
    LIMIT 10
""")

print("\nSample memberships:")
for email, site_name, joined_at in cursor.fetchall():
    print(f"  {email} -> {site_name} (joined: {joined_at})")

cursor.close()
conn.close()

print("\n=== DONE ===")
