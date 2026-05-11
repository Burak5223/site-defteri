import mysql.connector
import random
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("TÜM DAİRELERE MALİK ATAMA")
print("=" * 80)

# Get all apartments without owners
cursor.execute("""
    SELECT 
        a.id,
        a.unit_number,
        b.name as block_name,
        b.id as block_id
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id AND rh.is_owner = TRUE AND rh.move_out_date IS NULL
    WHERE b.site_id = '1' AND a.is_deleted = FALSE AND rh.id IS NULL
    ORDER BY b.name, a.unit_number
""")

apartments_without_owners = cursor.fetchall()

print(f"\nMaliki olmayan daire sayısı: {len(apartments_without_owners)}")

# Get all users from site 1 who are NOT already owners
cursor.execute("""
    SELECT u.id, u.full_name
    FROM users u
    WHERE u.site_id = '1'
    AND u.id NOT IN (
        SELECT DISTINCT user_id 
        FROM residency_history 
        WHERE is_owner = TRUE AND move_out_date IS NULL
    )
    ORDER BY RAND()
""")

available_users = cursor.fetchall()

print(f"Kullanılabilir kullanıcı sayısı: {len(available_users)}")

if len(available_users) < len(apartments_without_owners):
    print(f"\nUYARI: Yeterli kullanıcı yok! {len(apartments_without_owners)} daire var ama {len(available_users)} kullanıcı var.")
    print("Mevcut kullanıcıları kullanarak devam ediyoruz...")

# Assign owners to apartments
owner_count = 0
user_index = 0

for apt_id, unit_number, block_name, block_id in apartments_without_owners:
    # Get next available user (cycle through if needed)
    if user_index >= len(available_users):
        user_index = 0  # Start over if we run out of users
    
    user_id, user_name = available_users[user_index]
    user_index += 1
    
    # Insert into residency_history as owner
    cursor.execute("""
        INSERT INTO residency_history (apartment_id, user_id, is_owner, move_in_date)
        VALUES (%s, %s, TRUE, NOW())
    """, (apt_id, user_id))
    
    # Update apartment owner
    cursor.execute("""
        UPDATE apartments 
        SET owner_user_id = %s
        WHERE id = %s
    """, (user_id, apt_id))
    
    owner_count += 1
    print(f"{block_name} - Daire {unit_number}: Malik = {user_name}")

conn.commit()

print("\n" + "=" * 80)
print("SONUÇ")
print("=" * 80)
print(f"Yeni malik atandı: {owner_count} daire")

# Verify final counts
cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(DISTINCT a.id) as total_apartments,
        COUNT(DISTINCT CASE WHEN rh.is_owner = TRUE THEN rh.apartment_id END) as apartments_with_owners
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id AND rh.move_out_date IS NULL
    WHERE b.site_id = '1' AND a.is_deleted = FALSE
    GROUP BY b.id, b.name
    ORDER BY b.name
""")

results = cursor.fetchall()

print("\nFINAL DURUM:")
for block_name, total_apts, apts_with_owners in results:
    print(f"{block_name}: {apts_with_owners}/{total_apts} dairenin maliki var")

# Check if any apartment still has no owner
cursor.execute("""
    SELECT COUNT(*)
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id AND rh.is_owner = TRUE AND rh.move_out_date IS NULL
    WHERE b.site_id = '1' AND a.is_deleted = FALSE AND rh.id IS NULL
""")

remaining = cursor.fetchone()[0]

if remaining == 0:
    print("\n✓ TÜM DAİRELERİN MALİKİ VAR!")
else:
    print(f"\n⚠ Hala {remaining} dairenin maliki yok")

print("=" * 80)

cursor.close()
conn.close()
