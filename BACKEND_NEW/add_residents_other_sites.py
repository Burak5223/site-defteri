#!/usr/bin/env python3
"""
Add residents to OTHER sites (NOT Yeşilvadi - it already has 202 residents)
Create 20 residents per site for the 5 other sites
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

print("=== Adding Residents to Other Sites (NOT Yeşilvadi) ===\n")

# Get all sites EXCEPT Yeşilvadi
cursor.execute("""
    SELECT id, name FROM sites 
    WHERE name NOT LIKE '%Yeşil%'
    ORDER BY name
""")
sites = cursor.fetchall()

print(f"Found {len(sites)} sites (excluding Yeşilvadi):\n")

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
        ORDER BY block_name, unit_number
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
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            password = "sakin123"
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            phone = f"555{i:04d}{total_created:02d}"
            
            cursor.execute("""
                INSERT INTO users (
                    id, email, password_hash, full_name, phone, 
                    status, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, email, password_hash, full_name, phone,
                'aktif', datetime.now(), datetime.now()
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
        
        # Update apartment's current_resident_id
        cursor.execute("""
            UPDATE apartments 
            SET current_resident_id = %s, status = 'dolu'
            WHERE id = %s
        """, (user_id, apartment_id))
        
        total_created += 1
    
    connection.commit()
    print(f"  ✓ Created {residents_to_create} resident(s)")

print(f"\n{'='*60}")
print(f"✓ Total residents created: {total_created}")
print(f"✓ Credentials: sakin1.site2@test.com / sakin123")
print(f"✓ Yeşilvadi already has 202 residents - NOT touched")

cursor.close()
connection.close()

print(f"\n✓ Residents created successfully!")
