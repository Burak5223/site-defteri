import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=== BACKEND'DEN GELEN VERİYİ SİMÜLE EDİYORUZ ===\n")

# MessageService.getApartmentsForMessaging metodunu simüle et
cursor.execute("""
    SELECT 
        a.id,
        a.unit_number,
        a.block_name,
        a.floor,
        a.current_resident_id,
        u.full_name as resident_name
    FROM apartments a
    LEFT JOIN users u ON a.current_resident_id = u.id
    WHERE a.site_id = '1'
    ORDER BY a.block_name, CAST(a.unit_number AS UNSIGNED)
""")

apartments = cursor.fetchall()

print(f"Toplam daire sayısı: {len(apartments)}\n")

# Blok bazında grupla (frontend'deki gibi)
block_groups = {}
for apt in apartments:
    apt_id = apt[0]
    unit_number = apt[1]
    block_name = apt[2] if apt[2] else "Diğer"  # Frontend'deki mantık
    floor = apt[3]
    resident_id = apt[4]
    resident_name = apt[5] if apt[5] else "Boş Daire"
    
    if block_name not in block_groups:
        block_groups[block_name] = []
    
    block_groups[block_name].append({
        "id": apt_id,
        "number": unit_number,
        "block": block_name,
        "floor": floor,
        "residentName": resident_name
    })

print("=== BLOK GRUPLARI (FRONTEND'DE GÖRÜNEN) ===\n")
for block_name, apts in sorted(block_groups.items()):
    print(f"{block_name} Blok: {len(apts)} daire")
    if block_name == "Diğer":
        print("  İlk 5 daire:")
        for apt in apts[:5]:
            print(f"    - Daire {apt['number']}, Sakin: {apt['residentName']}")

cursor.close()
conn.close()
