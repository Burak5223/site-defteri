import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== CHECKING MESSAGING PERMISSION ISSUE ===\n")

# First check user_site_memberships table structure
cursor.execute("DESCRIBE user_site_memberships")
membership_columns = cursor.fetchall()
print("user_site_memberships table columns:")
for col in membership_columns:
    print(f"  - {col['Field']}")
print()

# Check which user is trying to send message
# Let's check all users and their site memberships
cursor.execute("""
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.site_id,
        usm.id as membership_id
    FROM users u
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id AND u.site_id = usm.site_id
    WHERE u.site_id = '1'
    ORDER BY u.email
""")

users = cursor.fetchall()

print(f"Total users in site 1: {len(users)}\n")

print("=== USER SITE MEMBERSHIPS ===")
for user in users:
    has_membership = user['membership_id'] is not None
    status = "✓ HAS MEMBERSHIP" if has_membership else "✗ NO MEMBERSHIP"
    print(f"{status} | {user['email']:40s} | ID: {user['id']}")

# Count users without membership
no_membership = [u for u in users if u['membership_id'] is None]
print(f"\n⚠️ Users WITHOUT site membership: {len(no_membership)}")

if no_membership:
    print("\nUsers that need membership:")
    for user in no_membership:
        print(f"  - {user['email']} (ID: {user['id']})")

cursor.close()
conn.close()

print("\n✓ Check completed!")
