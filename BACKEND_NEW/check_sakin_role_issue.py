import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== CHECKING SAKIN ROLE ISSUE ===\n")

# Get sakin user
cursor.execute("""
    SELECT u.id, u.email, u.full_name
    FROM users u
    WHERE u.email = 'sakin@site.com'
""")
sakin = cursor.fetchone()
print(f"Sakin user: {sakin['email']} (ID: {sakin['id']})")

# Check user_roles table
cursor.execute("""
    SELECT ur.role_id, r.name as role_name
    FROM user_roles ur
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = %s
""", (sakin['id'],))

roles = cursor.fetchall()
print(f"\nRoles in user_roles table:")
for role in roles:
    print(f"  - Role ID: {role['role_id']}, Name: {role['role_name']}")

# Check user_site_memberships
cursor.execute("""
    SELECT role_type, user_type, status
    FROM user_site_memberships
    WHERE user_id = %s
""", (sakin['id'],))

membership = cursor.fetchone()
if membership:
    print(f"\nSite membership:")
    print(f"  - role_type: {membership['role_type']}")
    print(f"  - user_type: {membership['user_type']}")
    print(f"  - status: {membership['status']}")
else:
    print("\n✗ No site membership found!")

# Check residency_history
cursor.execute("""
    SELECT apartment_id, status
    FROM residency_history
    WHERE user_id = %s
""", (sakin['id'],))

residency = cursor.fetchone()
if residency:
    print(f"\nResidency history:")
    print(f"  - apartment_id: {residency['apartment_id']}")
    print(f"  - status: {residency['status']}")
    
    # Get apartment details
    cursor.execute("""
        SELECT block_name, unit_number
        FROM apartments
        WHERE id = %s
    """, (residency['apartment_id'],))
    
    apartment = cursor.fetchone()
    if apartment:
        print(f"  - Apartment: {apartment['block_name']} {apartment['unit_number']}")
else:
    print("\n✗ No residency_history found!")

cursor.close()
conn.close()

print("\n✓ Check completed!")
