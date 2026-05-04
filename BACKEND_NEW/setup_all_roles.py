import mysql.connector
import bcrypt

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Generate BCrypt hash for "123456"
password = "123456"
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')

print(f"BCrypt hash: {password_hash}\n")

# Update all test users
test_users = [
    ("superadmin@site.com", "Super Admin", "5559990001"),
    ("admin@test.com", "Admin User", "5559990002"),
    ("resident@test.com", "Resident User", "5559990003"),
]

print("Updating existing users...")
for email, name, phone in test_users:
    cursor.execute("""
        UPDATE users 
        SET password_hash = %s, full_name = %s, phone = %s
        WHERE email = %s
    """, (password_hash, name, phone, email))
    if cursor.rowcount > 0:
        print(f"✓ Updated {email}")

# Check for Security and Cleaning users
cursor.execute("SELECT email, full_name FROM users WHERE email LIKE 'security%' OR email LIKE 'cleaning%'")
existing = cursor.fetchall()

if existing:
    print("\nFound existing Security/Cleaning users:")
    for row in existing:
        print(f"  {row[0]}: {row[1]}")
    
    # Update them
    cursor.execute("""
        UPDATE users 
        SET password_hash = %s, phone = '5559990004'
        WHERE email LIKE 'security%'
    """, (password_hash,))
    print(f"✓ Updated {cursor.rowcount} security user(s)")
    
    cursor.execute("""
        UPDATE users 
        SET password_hash = %s, phone = '5559990005'
        WHERE email LIKE 'cleaning%'
    """, (password_hash,))
    print(f"✓ Updated {cursor.rowcount} cleaning user(s)")
else:
    print("\nNo Security/Cleaning users found in database")

conn.commit()

# Verify all users
print("\n=== ALL TEST USERS ===")
cursor.execute("""
    SELECT email, full_name, phone 
    FROM users 
    WHERE email IN ('superadmin@site.com', 'admin@test.com', 'resident@test.com')
       OR email LIKE 'security%' 
       OR email LIKE 'cleaning%'
    ORDER BY email
""")

for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} - {row[2] or 'No phone'}")

cursor.close()
conn.close()

print("\n✓ All users ready with password: 123456")
