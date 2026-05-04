import mysql.connector
import sys

try:
    # application.properties'den şifreyi al
    with open('site/src/main/resources/application.properties', 'r', encoding='utf-8') as f:
        props = f.read()
        password = None
        for line in props.split('\n'):
            if 'spring.datasource.password' in line and not line.strip().startswith('#'):
                password = line.split('=')[1].strip()
                break
    
    if not password:
        password = 'root'
    
    print(f"Connecting to database with password: {password}")
    
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )
    
    cursor = conn.cursor()
    
    # Önce mevcut apartmanları kontrol et
    cursor.execute("SELECT COUNT(*) FROM apartments")
    count = cursor.fetchone()[0]
    print(f"Current apartments: {count}")
    
    if count == 0:
        print("Creating apartments...")
        
        apartments = [
            ('1', '1', None, '101', 1, '1', 120.0, 100.0, '3+1', 2, 1, 'kombi', 'daire', 'dolu', '1'),
            ('2', '1', None, '102', 1, '2', 120.0, 100.0, '3+1', 2, 1, 'kombi', 'daire', 'dolu', '2'),
            ('3', '1', None, '103', 1, '3', 120.0, 100.0, '3+1', 2, 1, 'kombi', 'daire', 'dolu', '3'),
            ('4', '1', None, '201', 2, '1', 120.0, 100.0, '3+1', 2, 1, 'kombi', 'daire', 'dolu', '1'),
            ('5', '1', None, '202', 2, '2', 120.0, 100.0, '3+1', 2, 1, 'kombi', 'daire', 'dolu', '2'),
            ('6', '1', None, '203', 2, '3', 120.0, 100.0, '3+1', 2, 1, 'kombi', 'daire', 'bos', None),
            ('7', '1', None, '301', 3, '1', 120.0, 100.0, '3+1', 2, 1, 'kombi', 'daire', 'bos', None),
            ('8', '1', None, '302', 3, '2', 120.0, 100.0, '3+1', 2, 1, 'kombi', 'daire', 'bos', None),
        ]
        
        for apt in apartments:
            cursor.execute("""
                INSERT INTO apartments 
                (id, site_id, block_id, apartment_number, floor, door_number, gross_area, net_area, 
                 room_count, bathroom_count, balcony_count, heating_type, apartment_type, status, owner_user_id, 
                 created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, apt)
        
        # Apartment users ilişkilerini ekle
        apt_users = [
            ('1', '1', 'owner', '2024-01-01', 1),
            ('2', '2', 'owner', '2024-01-01', 1),
            ('3', '3', 'owner', '2024-01-01', 1),
            ('4', '1', 'owner', '2024-01-01', 1),
            ('5', '2', 'owner', '2024-01-01', 1),
        ]
        
        for au in apt_users:
            cursor.execute("""
                INSERT INTO apartment_users 
                (apartment_id, user_id, relationship_type, move_in_date, is_primary, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """, au)
        
        conn.commit()
        print(f"Created {len(apartments)} apartments")
    
    # Kontrol
    cursor.execute("""
        SELECT 
            a.id,
            a.apartment_number,
            a.floor,
            a.status,
            u.full_name as owner_name
        FROM apartments a
        LEFT JOIN users u ON a.owner_user_id = u.id
        ORDER BY a.apartment_number
    """)
    
    print("\nApartments:")
    for row in cursor.fetchall():
        print(f"  {row[1]} (Floor {row[2]}) - {row[3]} - Owner: {row[4]}")
    
    cursor.close()
    conn.close()
    print("\nSuccess!")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
