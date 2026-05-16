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

# Check if security user exists
cursor.execute("SELECT id FROM users WHERE email = 'security@site.com'")
security_exists = cursor.fetchone()

if not security_exists:
    security_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash, phone, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (security_id, "Security User", "security@site.com", "security123", "5559876543", "aktif", datetime.now(), datetime.now()))
    
    # Add to user_roles
    cursor.execute("""
        INSERT INTO user_roles (user_id, role_name)
        VALUES (%s, %s)
    """, (security_id, "SECURITY"))
    
    # Add to site_memberships
    cursor.execute("""
        INSERT INTO site_memberships (user_id, site_id, joined_at)
        VALUES (%s, %s, %s)
    """, (security_id, "1", datetime.now()))
    
    print(f"✓ Created security user: {security_id}")
else:
    print("✓ Security user already exists")

# Check if cleaning user exists
cursor.execute("SELECT id FROM users WHERE email = 'cleaning@site.com'")
cleaning_exists = cursor.fetchone()

if not cleaning_exists:
    cleaning_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash, phone, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (cleaning_id, "Cleaning User", "cleaning@site.com", "cleaning123", "5559876544", "aktif", datetime.now(), datetime.now()))
    
    # Add to user_roles
    cursor.execute("""
        INSERT INTO user_roles (user_id, role_name)
        VALUES (%s, %s)
    """, (cleaning_id, "CLEANING"))
    
    # Add to site_memberships
    cursor.execute("""
        INSERT INTO site_memberships (user_id, site_id, joined_at)
        VALUES (%s, %s, %s)
    """, (cleaning_id, "1", datetime.now()))
    
    print(f"✓ Created cleaning user: {cleaning_id}")
else:
    print("✓ Cleaning user already exists")

conn.commit()
cursor.close()
conn.close()

print("\n✓ All users ready for testing")
