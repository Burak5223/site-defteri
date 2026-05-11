import mysql.connector
import bcrypt
import uuid

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

# Find Yeşilvadi site ID
cursor.execute("SELECT id, name FROM sites WHERE name LIKE '%yeşil%' OR name LIKE '%Yeşil%' OR id = '1'")
sites = cursor.fetchall()
print("=== AVAILABLE SITES ===")
for site in sites:
    print(f"ID: {site[0]}, Name: {site[1]}")

# Use site ID 1 (Yeşilvadi)
yesilvadi_site_id = '1'
print(f"\nUsing site ID: {yesilvadi_site_id}")

# Find role IDs
cursor.execute("SELECT id, name FROM roles")
roles = cursor.fetchall()
role_map = {role[1]: role[0] for role in roles}
print("\n=== AVAILABLE ROLES ===")
for role_name, role_id in role_map.items():
    print(f"{role_name}: {role_id}")

# Standard test users
test_users = [
    {
        'email': 'admin@site.com',
        'password': 'admin123',
        'full_name': 'Admin User',
        'role': 'ADMIN',
        'site_id': yesilvadi_site_id
    },
    {
        'email': 'sakin@site.com',
        'password': 'sakin123',
        'full_name': 'Sakin User',
        'role': 'RESIDENT',
        'site_id': yesilvadi_site_id
    },
    {
        'email': 'guvenlik@site.com',
        'password': 'guvenlik123',
        'full_name': 'Güvenlik User',
        'role': 'SECURITY',
        'site_id': yesilvadi_site_id
    },
    {
        'email': 'temizlik@site.com',
        'password': 'temizlik123',
        'full_name': 'Temizlik User',
        'role': 'CLEANING',
        'site_id': yesilvadi_site_id
    },
    {
        'email': 'superadmin@site.com',
        'password': 'superadmin123',
        'full_name': 'Super Admin User',
        'role': 'SUPER_ADMIN',
        'site_id': None  # Super admin has no site
    }
]

print("\n=== CREATING TEST USERS ===")

for user_data in test_users:
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = %s", (user_data['email'],))
    existing = cursor.fetchone()
    
    if existing:
        user_id = existing[0]
        print(f"\nUser {user_data['email']} already exists, updating...")
        
        # Update password
        password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("""
            UPDATE users 
            SET password_hash = %s, 
                full_name = %s,
                site_id = %s,
                status = 'aktif',
                email_verified = 1,
                phone_verified = 1
            WHERE id = %s
        """, (password_hash, user_data['full_name'], user_data['site_id'], user_id))
        
    else:
        print(f"\nCreating user {user_data['email']}...")
        user_id = str(uuid.uuid4())
        
        # Hash password
        password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, full_name, site_id, status, email_verified, phone_verified)
            VALUES (%s, %s, %s, %s, %s, 'aktif', 1, 1)
        """, (user_id, user_data['email'], password_hash, user_data['full_name'], user_data['site_id']))
    
    # Delete existing roles for this user
    cursor.execute("DELETE FROM user_roles WHERE user_id = %s", (user_id,))
    
    # Add role
    role_name = user_data['role']
    if role_name not in role_map:
        # Try with ROLE_ prefix
        role_name = f"ROLE_{role_name}"
    
    if role_name in role_map:
        role_id = role_map[role_name]
        user_role_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO user_roles (id, user_id, role_id, site_id)
            VALUES (%s, %s, %s, %s)
        """, (user_role_id, user_id, role_id, user_data['site_id']))
        print(f"  ✓ Created with role: {role_name}")
    else:
        print(f"  ✗ Role not found: {role_name}")

conn.commit()

print("\n=== VERIFICATION ===")
for user_data in test_users:
    cursor.execute("""
        SELECT u.email, u.full_name, u.site_id, r.name as role_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = %s
    """, (user_data['email'],))
    
    result = cursor.fetchone()
    if result:
        print(f"\n{result[0]}")
        print(f"  Name: {result[1]}")
        print(f"  Site ID: {result[2]}")
        print(f"  Role: {result[3]}")
        print(f"  Password: {user_data['password']}")

cursor.close()
conn.close()

print("\n=== DONE ===")
print("All test users created/updated successfully!")
