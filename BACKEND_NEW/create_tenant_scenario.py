import mysql.connector
from datetime import datetime

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

print("Creating tenant scenario...")

# Create owner user
try:
    cursor.execute("""
        INSERT INTO users (id, full_name, email, phone, password_hash, status, email_verified, phone_verified, created_at, updated_at)
        VALUES ('owner-user-1', 'Owner User', 'owner@site.com', '+905551111111', 'owner123', 'aktif', true, true, NOW(), NOW())
    """)
    print("✓ Owner user created")
except Exception as e:
    print(f"Owner user already exists or error: {e}")

# Create tenant user
try:
    cursor.execute("""
        INSERT INTO users (id, full_name, email, phone, password_hash, status, email_verified, phone_verified, created_at, updated_at)
        VALUES ('tenant-user-1', 'Tenant User', 'tenant@site.com', '+905552222222', 'tenant123', 'aktif', true, true, NOW(), NOW())
    """)
    print("✓ Tenant user created")
except Exception as e:
    print(f"Tenant user already exists or error: {e}")

# Update apartment 4
cursor.execute("""
    UPDATE apartments 
    SET owner_user_id = 'owner-user-1',
        current_resident_id = 'tenant-user-1',
        status = 'dolu'
    WHERE id = '4'
""")
print("✓ Apartment 4 updated with owner and tenant")

conn.commit()

# Verify
print("\nVerifying apartment 4:")
cursor.execute("""
    SELECT 
        a.unit_number,
        a.owner_user_id,
        a.current_resident_id,
        o.full_name as owner_name,
        o.email as owner_email,
        t.full_name as tenant_name,
        t.email as tenant_email
    FROM apartments a
    LEFT JOIN users o ON a.owner_user_id = o.id
    LEFT JOIN users t ON a.current_resident_id = t.id
    WHERE a.id = '4'
""")

result = cursor.fetchone()
if result:
    print(f"  Unit: {result[0]}")
    print(f"  Owner: {result[3]} ({result[4]})")
    print(f"  Tenant: {result[5]} ({result[6]})")

cursor.close()
conn.close()

print("\n✓ Tenant scenario created successfully!")
