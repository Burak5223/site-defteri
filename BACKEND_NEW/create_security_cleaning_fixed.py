import mysql.connector
import uuid
from datetime import datetime

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Get role IDs
cursor.execute("SELECT id, name FROM roles WHERE name IN ('SECURITY', 'CLEANING')")
roles = {row[1]: row[0] for row in cursor.fetchall()}

if 'SECURITY' not in roles:
    security_role_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO roles (id, name, description) VALUES (%s, %s, %s)", 
                  (security_role_id, "SECURITY", "Security personnel"))
    roles['SECURITY'] = security_role_id
    print("✓ Created SECURITY role")

if 'CLEANING' not in roles:
    cleaning_role_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO roles (id, name, description) VALUES (%s, %s, %s)", 
                  (cleaning_role_id, "CLEANING", "Cleaning staff"))
    roles['CLEANING'] = cleaning_role_id
    print("✓ Created CLEANING role")

# Check if security user exists
cursor.execute("SELECT id FROM users WHERE email = 'security@site.com'")
security_user = cursor.fetchone()

if not security_user:
    security_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash, phone, site_id, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (security_id, "Security User", "security@site.com", "security123", "5559876543", "1", "aktif", datetime.now(), datetime.now()))
    
    # Add to user_roles
    cursor.execute("""
        INSERT INTO user_roles (id, user_id, role_id, site_id, assigned_at, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (str(uuid.uuid4()), security_id, roles['SECURITY'], "1", datetime.now(), datetime.now(), datetime.now()))
    
    # Add to site_memberships
    cursor.execute("""
        INSERT INTO site_memberships (user_id, site_id, joined_at)
        VALUES (%s, %s, %s)
    """, (security_id, "1", datetime.now()))
    
    print(f"✓ Created security user: {security_id}")
else:
    print("✓ Security user already exists")
    security_id = security_user[0]

# Check if cleaning user exists
cursor.execute("SELECT id FROM users WHERE email = 'cleaning@site.com'")
cleaning_user = cursor.fetchone()

if not cleaning_user:
    cleaning_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash, phone, site_id, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (cleaning_id, "Cleaning User", "cleaning@site.com", "cleaning123", "5559876544", "1", "aktif", datetime.now(), datetime.now()))
    
    # Add to user_roles
    cursor.execute("""
        INSERT INTO user_roles (id, user_id, role_id, site_id, assigned_at, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (str(uuid.uuid4()), cleaning_id, roles['CLEANING'], "1", datetime.now(), datetime.now(), datetime.now()))
    
    # Add to site_memberships
    cursor.execute("""
        INSERT INTO site_memberships (user_id, site_id, joined_at)
        VALUES (%s, %s, %s)
    """, (cleaning_id, "1", datetime.now()))
    
    print(f"✓ Created cleaning user: {cleaning_id}")
else:
    print("✓ Cleaning user already exists")
    cleaning_id = cleaning_user[0]

conn.commit()
cursor.close()
conn.close()

print("\n✓ All users ready for testing")
print(f"Security: security@site.com / security123")
print(f"Cleaning: cleaning@site.com / cleaning123")
