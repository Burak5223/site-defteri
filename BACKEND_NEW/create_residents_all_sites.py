#!/usr/bin/env python3
"""
Create test residents for all sites (20 residents per site)
"""
import mysql.connector
import bcrypt
import uuid
from datetime import datetime

connection = mysql.connector.connect(
    host='localhost',
    database='smart_site_management',
    user='root',
    password='Hilton5252.'
)

cursor = connection.cursor(dictionary=True)

print("=== Creating Residents for All Sites ===\n")

# Get all sites
cursor.execute("SELECT id, name FROM sites ORDER BY name")
sites = cursor.fetchall()

# Get RESIDENT role ID
cursor.execute("SELECT id FROM roles WHERE name = 'RESIDENT'")
resident_role = cursor.fetchone()
if not resident_role:
    print("❌ RESIDENT role not found!")
    cursor.close()
    connection.close()
    exit(1)

resident_role_id = resident_role['id']

# Turkish first names
first_names = [
    "Ahmet", "Mehmet", "Ayşe", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif",
    "Hüseyin", "Emine", "Can", "Deniz", "Cem", "Selin", "Burak", "Merve",
    "Emre", "Esra", "Murat", "Gizem", "Kemal", "Burcu", "Serkan", "Pınar"
]

last_names = [
    "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk",
    "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt",
    "Özdemir", "Şimşek", "Erdoğan", "Güneş", "Aksoy", "Avcı", "Türk", "Polat"
]

total_created = 0

for site in sites:
    site_id = site['id']
    site_name = site['name']
    
    print(f"\n{site_name}")
    print("-" * 60)
    
    # Get apartments for this site
    cursor.execute("""
        SELECT id FROM apartments 
        WHERE site_id = %s AND is_deleted = 0
        ORDER BY block_name, apartment_number
        LIMIT 20
    """, (site_id,))
    
    apartments = cursor.fetchall()
    
    if not apartments:
        print(f"  ⚠️  No apartments found, skipping...")
        continue
    
    # Create 20 residents for this site
    residents_to_create = min(20, len(apartments))
    
    for i in range(residents_to_create):
        # Generate unique user data
        first_name = first_names[i % len(first_names)]
        last_name = last_names[i % len(last_names)]
        full_name = f"{first_name} {last_name}"
        
        # Create unique email
        email = f"sakin{i+1}.site{site_id}@test.com"
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            user_id = existing_user['id']
            print(f"  User {email} already exists, using existing")
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            password = "sakin123"
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            phone = f"555{i:04d}{site_id:02d}"
            
            cursor.execute("""
                INSERT INTO users (
                    id, email, password_hash, full_name, phone, 
                    is_active, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, email, password_hash, full_name, phone,
                1, datetime.now(), datetime.now()
            ))
            
            # Add RESIDENT role
            cursor.execute("""
                INSERT INTO user_roles (user_id, role_id)
                VALUES (%s, %s)
            """, (user_id, resident_role_id))
        
        # Check if membership already exists
        cursor.execute("""
            SELECT id FROM user_site_memberships 
            WHERE user_id = %s AND site_id = %s
        """, (user_id, site_id))
        
        existing_membership = cursor.fetchone()
        
        if not existing_membership:
            # Create membership
            membership_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO user_site_memberships (
                    id, user_id, site_id, role_type, status, 
                    is_deleted, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                membership_id, user_id, site_id, 'RESIDENT', 'aktif',
                0, datetime.now(), datetime.now()
            ))
        
        # Assign to apartment
        apartment_id = apartments[i]['id']
        
        # Check if residency already exists
        cursor.execute("""
            SELECT id FROM residency 
            WHERE user_id = %s AND apartment_id = %s
        """, (user_id, apartment_id))
        
        existing_residency = cursor.fetchone()
        
        if not existing_residency:
            residency_id = str(uuid.uuid4())
            residency_type = 'mal_sahibi' if i % 3 == 0 else 'kiracı'
            
            cursor.execute("""
                INSERT INTO residency (
                    id, user_id, apartment_id, residency_type, 
                    start_date, is_current, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                residency_id, user_id, apartment_id, residency_type,
                datetime.now(), 1, datetime.now()
            ))
        
        total_created += 1
    
    connection.commit()
    print(f"  ✓ Created {residents_to_create} resident(s)")

print(f"\n{'='*60}")
print(f"✓ Total residents created: {total_created}")
print(f"✓ Credentials: sakin1.site1@test.com / sakin123")

cursor.close()
connection.close()

print(f"\n✓ Residents created successfully!")
