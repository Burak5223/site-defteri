#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("\n" + "=" * 80)
print("WHO IS IN A BLOK 12 AND B BLOK 36?")
print("=" * 80)

cursor.execute("""
    SELECT u.full_name, u.email, b.name, a.unit_number, rh.is_owner
    FROM residency_history rh
    JOIN users u ON rh.user_id = u.id
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE ((b.name = 'A Blok' AND a.unit_number = '12') 
           OR (b.name = 'B Blok' AND a.unit_number = '36'))
      AND rh.status = 'active' 
      AND rh.is_deleted = FALSE
    ORDER BY b.name, a.unit_number
""")

residents = cursor.fetchall()

if residents:
    print(f"\nFound {len(residents)} active resident(s):")
    for name, email, block, unit, is_owner in residents:
        role = "Malik" if is_owner else "Kiracı"
        print(f"   {block} - {unit}: {name} ({email}) - {role}")
else:
    print("\n❌ No active residents found!")

cursor.close()
conn.close()
