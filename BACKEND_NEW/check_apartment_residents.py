import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor(dictionary=True)

# Check apartments and their residents
print("=" * 80)
print("DAIRE VE SAKİNLER KONTROLÜ")
print("=" * 80)

# Get apartments with their residents
query = """
SELECT 
    a.id as apartment_id,
    a.unit_number,
    b.name as block_name,
    a.owner_user_id,
    a.current_resident_id,
    owner.full_name as owner_name,
    resident.full_name as resident_name,
    (SELECT COUNT(*) FROM residency_history rh 
     WHERE rh.apartment_id = a.id AND rh.move_out_date IS NULL) as resident_count
FROM apartments a
LEFT JOIN blocks b ON a.block_id = b.id
LEFT JOIN users owner ON a.owner_user_id = owner.id
LEFT JOIN users resident ON a.current_resident_id = resident.id
WHERE a.is_deleted = FALSE
ORDER BY b.name, a.unit_number
LIMIT 10;
"""

cursor.execute(query)
apartments = cursor.fetchall()

for apt in apartments:
    print(f"\n📍 Daire: {apt['block_name']} Blok - {apt['unit_number']}")
    print(f"   Apartment ID: {apt['apartment_id']}")
    print(f"   Owner ID: {apt['owner_user_id']}")
    print(f"   Owner Name: {apt['owner_name']}")
    print(f"   Current Resident ID: {apt['current_resident_id']}")
    print(f"   Current Resident Name: {apt['resident_name']}")
    print(f"   Resident Count (from residency_history): {apt['resident_count']}")
    
    # Check residency_history for this apartment
    cursor.execute("""
        SELECT 
            rh.user_id,
            u.full_name,
            rh.is_owner,
            rh.move_in_date,
            rh.move_out_date
        FROM residency_history rh
        JOIN users u ON rh.user_id = u.id
        WHERE rh.apartment_id = %s AND rh.move_out_date IS NULL
        ORDER BY rh.is_owner DESC
    """, (apt['apartment_id'],))
    
    residents = cursor.fetchall()
    print(f"   \n   Residency History'deki Aktif Sakinler:")
    for res in residents:
        role = "MALİK" if res['is_owner'] else "KİRACI"
        print(f"      - {res['full_name']} ({role}) - User ID: {res['user_id']}")

print("\n" + "=" * 80)

# Check if there are apartments with only tenant or only owner
cursor.execute("""
    SELECT 
        COUNT(*) as total_apartments,
        SUM(CASE WHEN owner_user_id IS NOT NULL THEN 1 ELSE 0 END) as with_owner,
        SUM(CASE WHEN current_resident_id IS NOT NULL THEN 1 ELSE 0 END) as with_resident,
        SUM(CASE WHEN owner_user_id IS NOT NULL AND current_resident_id IS NOT NULL THEN 1 ELSE 0 END) as with_both
    FROM apartments
    WHERE is_deleted = FALSE
""")

stats = cursor.fetchone()
print("\nİSTATİSTİKLER:")
print(f"Toplam Daire: {stats['total_apartments']}")
print(f"Maliki Olan: {stats['with_owner']}")
print(f"Kiracısı Olan: {stats['with_resident']}")
print(f"Hem Malik Hem Kiracı: {stats['with_both']}")

cursor.close()
conn.close()
