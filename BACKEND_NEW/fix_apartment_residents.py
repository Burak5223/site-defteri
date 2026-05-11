import mysql.connector
import random

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("DAİRE SAKİNLERİNİ DÜZELTİYORUZ")
print("=" * 80)

# Get A Block
cursor.execute("SELECT id, name FROM blocks WHERE name LIKE '%A%' LIMIT 1")
block = cursor.fetchone()

if block:
    block_id, block_name = block
    print(f"\nBlok: {block_name}")
    
    # Get all apartments in A Block
    cursor.execute("""
        SELECT id, unit_number
        FROM apartments 
        WHERE block_id = %s AND is_deleted = FALSE
        ORDER BY unit_number
    """, (block_id,))
    
    apartments = cursor.fetchall()
    print(f"Toplam Daire: {len(apartments)}")
    
    # Get all users from site 1
    cursor.execute("""
        SELECT id, full_name 
        FROM users 
        WHERE site_id = '1'
        ORDER BY RAND()
    """)
    
    all_users = cursor.fetchall()
    print(f"Toplam Kullanıcı: {len(all_users)}")
    
    if len(all_users) < len(apartments):
        print(f"\nHATA: Yeterli kullanıcı yok! {len(apartments)} daire var ama {len(all_users)} kullanıcı var.")
        cursor.close()
        conn.close()
        exit(1)
    
    # Clear existing residency_history for A Block apartments
    apt_ids = [apt[0] for apt in apartments]
    if apt_ids:
        placeholders = ','.join(['%s'] * len(apt_ids))
        cursor.execute(f"""
            DELETE FROM residency_history 
            WHERE apartment_id IN ({placeholders})
        """, apt_ids)
        print(f"\nEski kayıtlar silindi: {cursor.rowcount} kayıt")
    
    # Assign owners and tenants
    used_users = set()
    owner_count = 0
    tenant_count = 0
    
    # Shuffle users
    random.shuffle(all_users)
    user_index = 0
    
    for apt_id, unit_number in apartments:
        # Assign owner (malik)
        if user_index < len(all_users):
            owner_id, owner_name = all_users[user_index]
            used_users.add(owner_id)
            user_index += 1
            
            cursor.execute("""
                INSERT INTO residency_history (apartment_id, user_id, is_owner, move_in_date)
                VALUES (%s, %s, TRUE, NOW())
            """, (apt_id, owner_id))
            
            # Update apartment owner
            cursor.execute("""
                UPDATE apartments 
                SET owner_user_id = %s
                WHERE id = %s
            """, (owner_id, apt_id))
            
            owner_count += 1
            print(f"Daire {unit_number}: Malik = {owner_name}")
            
            # 85% chance to add a tenant (kiracı)
            if random.random() < 0.85 and user_index < len(all_users):
                tenant_id, tenant_name = all_users[user_index]
                if tenant_id not in used_users:
                    used_users.add(tenant_id)
                    user_index += 1
                    
                    cursor.execute("""
                        INSERT INTO residency_history (apartment_id, user_id, is_owner, move_in_date)
                        VALUES (%s, %s, FALSE, NOW())
                    """, (apt_id, tenant_id))
                    
                    # Update apartment current resident
                    cursor.execute("""
                        UPDATE apartments 
                        SET current_resident_id = %s
                        WHERE id = %s
                    """, (tenant_id, apt_id))
                    
                    tenant_count += 1
                    print(f"           Kiracı = {tenant_name}")
    
    conn.commit()
    
    print("\n" + "=" * 80)
    print("SONUÇ")
    print("=" * 80)
    print(f"Toplam Daire: {len(apartments)}")
    print(f"Malik Atandı: {owner_count}")
    print(f"Kiracı Atandı: {tenant_count}")
    print(f"Sadece Malik Olan Daire: {owner_count - tenant_count}")
    print(f"Malik + Kiracı Olan Daire: {tenant_count}")
    print("=" * 80)

cursor.close()
conn.close()
