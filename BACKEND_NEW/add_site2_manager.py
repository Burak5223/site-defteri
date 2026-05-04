import mysql.connector
import uuid

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Get site 2
cursor.execute("SELECT id, name FROM sites WHERE id = '2'")
site = cursor.fetchone()

if not site:
    print("Site 2 not found!")
    conn.close()
    exit(1)

print(f"Site: {site[1]} (ID: {site[0]})")

# Check if admin exists for site 2
cursor.execute("""
    SELECT u.email FROM users u
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE usm.site_id = '2' AND usm.role_type = 'yonetici'
""")

existing = cursor.fetchone()
if existing:
    print(f"Manager already exists: {existing[0]}")
    conn.close()
    exit(0)

# Get Test Admin user
cursor.execute("SELECT id, email, full_name FROM users WHERE email = 'admin@test.com'")
user = cursor.fetchone()

if not user:
    print("Test Admin user not found!")
    conn.close()
    exit(1)

print(f"User: {user[2]} ({user[1]})")

# Add membership
membership_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO user_site_memberships (id, user_id, site_id, role_type, is_deleted, created_at, updated_at)
    VALUES (%s, %s, %s, 'yonetici', FALSE, NOW(), NOW())
""", (membership_id, user[0], '2'))

conn.commit()
print(f"✅ Added manager to site 2: {user[2]}")

conn.close()
