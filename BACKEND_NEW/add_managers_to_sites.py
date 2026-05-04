import mysql.connector
import uuid
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

print("\n=== ADDING MANAGERS TO SITES WITHOUT MANAGERS ===\n")

# Sites without managers and their new manager info
sites_to_add_managers = [
    {
        'site_id': '696bda7c-21bd-47d3-b748-437f56aea42d',
        'site_name': 'Deniz Manzarası Sitesi',
        'manager_name': 'Deniz Yöneticisi',
        'manager_email': 'deniz@manager.com',
        'manager_phone': '+905551112222',
        'password': '123456'
    },
    {
        'site_id': '9ddd0eb4-e736-4b65-bf60-d4a2960816f7',
        'site_name': 'Gül Bahçesi Rezidansı',
        'manager_name': 'Gül Yöneticisi',
        'manager_email': 'gul@manager.com',
        'manager_phone': '+905551113333',
        'password': '123456'
    },
    {
        'site_id': 'b928ccf3-0be1-436b-8b1e-5860bb05fad5',
        'site_name': 'Orman Evleri',
        'manager_name': 'Orman Yöneticisi',
        'manager_email': 'orman@manager.com',
        'manager_phone': '+905551114444',
        'password': '123456'
    },
    {
        'site_id': '69de5841-417e-47cc-93b6-693274fd4b7c',
        'site_name': 'Şehir Merkezi Residence',
        'manager_name': 'Şehir Yöneticisi',
        'manager_email': 'sehir@manager.com',
        'manager_phone': '+905551115555',
        'password': '123456'
    }
]

for site_info in sites_to_add_managers:
    print(f"Creating manager for: {site_info['site_name']}")
    
    # Generate user ID
    user_id = str(uuid.uuid4())
    
    # Insert user (using plain password in password_hash - backend will handle hashing)
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, full_name, phone, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        user_id,
        site_info['manager_email'],
        site_info['password'],  # Plain password (will be hashed by backend on first login)
        site_info['manager_name'],
        site_info['manager_phone'],
        'aktif',
        datetime.now(),
        datetime.now()
    ))
    
    print(f"  ✓ Created user: {site_info['manager_name']} (ID: {user_id})")
    
    # Insert user_site_membership with yonetici role
    membership_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO user_site_memberships (id, user_id, site_id, role_type, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        membership_id,
        user_id,
        site_info['site_id'],
        'yonetici',
        datetime.now(),
        datetime.now()
    ))
    
    print(f"  ✓ Assigned as manager (yonetici) to site: {site_info['site_name']}")
    print(f"  Email: {site_info['manager_email']}, Password: {site_info['password']}")
    print()

conn.commit()

print("\n=== VERIFICATION ===\n")

# Verify all sites now have managers
cursor.execute("""
    SELECT s.name, COUNT(usm.id) as manager_count
    FROM sites s
    LEFT JOIN user_site_memberships usm ON s.id = usm.site_id AND usm.role_type = 'yonetici'
    GROUP BY s.id, s.name
    ORDER BY s.name
""")

results = cursor.fetchall()
for site_name, manager_count in results:
    status = "✓" if manager_count > 0 else "✗"
    print(f"{status} {site_name}: {manager_count} manager(s)")

cursor.close()
conn.close()

print("\n✅ All managers created successfully!")
print("\nManager Credentials:")
print("=" * 50)
for site_info in sites_to_add_managers:
    print(f"{site_info['site_name']}:")
    print(f"  Email: {site_info['manager_email']}")
    print(f"  Password: {site_info['password']}")
