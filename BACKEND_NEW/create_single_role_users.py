import mysql.connector
import uuid
from werkzeug.security import generate_password_hash

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== CREATING SINGLE ROLE USERS ===\n")

# Get role IDs
cursor.execute("SELECT id, name FROM roles WHERE name IN ('ROLE_ADMIN', 'ROLE_SECURITY', 'ROLE_CLEANING')")
roles = {row['name']: row['id'] for row in cursor.fetchall()}

print("Roles found:")
for name, id in roles.items():
    print(f"  {name}: {id}")
print()

# Delete existing test users
print("Deleting existing test users and their related data...")

# Get user IDs to delete
cursor.execute("""
    SELECT id FROM users 
    WHERE email IN ('admin@test.com', 'security@test.com', 'cleaning@test.com', 'manager@test.com') 
    OR phone IN ('+905551234567', '+905551234568', '+905551234569')
""")
user_ids = [row['id'] for row in cursor.fetchall()]

if user_ids:
    user_ids_str = "', '".join(user_ids)
    
    # Delete from all related tables
    cursor.execute(f"DELETE FROM visitors WHERE authorized_by IN ('{user_ids_str}')")
    cursor.execute(f"DELETE FROM tickets WHERE user_id IN ('{user_ids_str}')")
    cursor.execute(f"DELETE FROM tasks WHERE assigned_to IN ('{user_ids_str}')")
    cursor.execute(f"DELETE FROM messages WHERE sender_id IN ('{user_ids_str}') OR receiver_id IN ('{user_ids_str}')")
    cursor.execute(f"DELETE FROM user_roles WHERE user_id IN ('{user_ids_str}')")
    cursor.execute(f"DELETE FROM user_site_memberships WHERE user_id IN ('{user_ids_str}')")
    cursor.execute(f"DELETE FROM users WHERE id IN ('{user_ids_str}')")
    
    conn.commit()
    print(f"✓ Deleted {len(user_ids)} old test users and their data\n")
else:
    print("✓ No existing test users to delete\n")

# Create new users
users_to_create = [
    {
        'email': 'manager@test.com',
        'full_name': 'Site Yöneticisi',
        'phone': '+905551234567',
        'password': '123456',
        'role': 'ROLE_ADMIN'
    },
    {
        'email': 'security@test.com',
        'full_name': 'Güvenlik Görevlisi',
        'phone': '+905551234568',
        'password': '123456',
        'role': 'ROLE_SECURITY'
    },
    {
        'email': 'cleaning@test.com',
        'full_name': 'Temizlik Personeli',
        'phone': '+905551234569',
        'password': '123456',
        'role': 'ROLE_CLEANING'
    }
]

print("Creating new users...")
for user_data in users_to_create:
    user_id = str(uuid.uuid4())
    
    # Insert user
    cursor.execute("""
        INSERT INTO users (id, email, full_name, phone, password_hash, status, email_verified, phone_verified, created_at)
        VALUES (%s, %s, %s, %s, %s, 'aktif', TRUE, TRUE, NOW())
    """, (
        user_id,
        user_data['email'],
        user_data['full_name'],
        user_data['phone'],
        generate_password_hash(user_data['password'])
    ))
    
    # Assign role
    role_id = roles[user_data['role']]
    cursor.execute("""
        INSERT INTO user_roles (user_id, role_id)
        VALUES (%s, %s)
    """, (user_id, role_id))
    
    # Assign to site 1
    membership_id = str(uuid.uuid4())
    role_type = 'MANAGER' if user_data['role'] == 'ROLE_ADMIN' else ('SECURITY' if user_data['role'] == 'ROLE_SECURITY' else 'CLEANING')
    cursor.execute("""
        INSERT INTO user_site_memberships (id, user_id, site_id, role_type, joined_at)
        VALUES (%s, %s, '1', %s, NOW())
        ON DUPLICATE KEY UPDATE site_id = '1', role_type = %s
    """, (membership_id, user_id, role_type, role_type))
    
    print(f"✓ Created: {user_data['full_name']} ({user_data['email']}) - {user_data['role']}")

conn.commit()

print("\n=== VERIFICATION ===\n")

# Verify created users
cursor.execute("""
    SELECT u.email, u.full_name, r.name as role_name
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.email IN ('manager@test.com', 'security@test.com', 'cleaning@test.com')
    ORDER BY u.email
""")

users = cursor.fetchall()
print(f"Created {len(users)} users:\n")
for user in users:
    print(f"  {user['full_name']} ({user['email']}) - {user['role_name']}")

cursor.close()
conn.close()

print("\n✓ Done!")
print("\nLogin credentials:")
print("  Manager:  manager@test.com / 123456")
print("  Security: security@test.com / 123456")
print("  Cleaning: cleaning@test.com / 123456")
