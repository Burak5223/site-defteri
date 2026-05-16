import mysql.connector

# Database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = db.cursor(dictionary=True)

print("=" * 80)
print("SAKİN KULLANICISI VE ARIZALAR KONTROL")
print("=" * 80)

# Sakin kullanıcısını bul
cursor.execute("""
    SELECT id, full_name, email, site_id
    FROM users
    WHERE email = 'sakin@site.com'
""")
sakin = cursor.fetchone()

if sakin:
    print(f"\nSakin Kullanıcısı:")
    print(f"  ID: {sakin['id']}")
    print(f"  Full Name: {sakin['full_name']}")
    print(f"  Site ID: {sakin['site_id']}")
    
    # Sakin'in dairelerini kontrol et
    cursor.execute("""
        SELECT apartment_id, is_owner, status
        FROM residency_history
        WHERE user_id = %s AND status = 'active'
    """, (sakin['id'],))
    residencies = cursor.fetchall()
    
    print(f"\n  Residency Kayıtları: {len(residencies)}")
    apartment_ids = []
    for res in residencies:
        owner_type = "Mal Sahibi" if res['is_owner'] else "Kiracı"
        print(f"    - Apartment ID: {res['apartment_id']}, Tip: {owner_type}, Durum: {res['status']}")
        apartment_ids.append(res['apartment_id'])
    
    if apartment_ids:
        # Bu dairelere ait arızaları kontrol et
        placeholders = ','.join(['%s'] * len(apartment_ids))
        cursor.execute(f"""
            SELECT t.*, a.unit_number, b.name as block_name
            FROM tickets t
            LEFT JOIN apartments a ON t.apartment_id = a.id
            LEFT JOIN blocks b ON a.block_id = b.id
            WHERE t.apartment_id IN ({placeholders})
            ORDER BY t.created_at DESC
        """, apartment_ids)
        tickets = cursor.fetchall()
        
        print(f"\n  Dairelerine Ait Arızalar: {len(tickets)}")
        for ticket in tickets:
            print(f"\n    Arıza ID: {ticket['id']}")
            print(f"      Başlık: {ticket['title']}")
            print(f"      Durum: {ticket['status']}")
            print(f"      Daire: {ticket['block_name']} - {ticket['unit_number']}")
            print(f"      Apartment ID: {ticket['apartment_id']}")
    else:
        print("\n  ⚠️ Sakin'in hiç dairesi yok!")
        
        # Sakin'in kendi oluşturduğu arızaları kontrol et
        cursor.execute("""
            SELECT t.*, a.unit_number, b.name as block_name
            FROM tickets t
            LEFT JOIN apartments a ON t.apartment_id = a.id
            LEFT JOIN blocks b ON a.block_id = b.id
            WHERE t.user_id = %s
            ORDER BY t.created_at DESC
        """, (sakin['id'],))
        tickets = cursor.fetchall()
        
        print(f"\n  Kendi Oluşturduğu Arızalar: {len(tickets)}")
        for ticket in tickets:
            print(f"\n    Arıza ID: {ticket['id']}")
            print(f"      Başlık: {ticket['title']}")
            print(f"      Durum: {ticket['status']}")
            if ticket['unit_number']:
                print(f"      Daire: {ticket['block_name']} - {ticket['unit_number']}")
            print(f"      Apartment ID: {ticket['apartment_id']}")

# Tüm arızaları listele
print("\n" + "=" * 80)
print("TÜM ARIZALAR")
print("=" * 80)

cursor.execute("""
    SELECT t.id, t.title, t.status, t.apartment_id, t.user_id, t.site_id,
           a.unit_number, b.name as block_name,
           u.full_name, u.email
    FROM tickets t
    LEFT JOIN apartments a ON t.apartment_id = a.id
    LEFT JOIN blocks b ON a.block_id = b.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.site_id = '1'
    ORDER BY t.created_at DESC
""")
all_tickets = cursor.fetchall()

print(f"\nToplam Arıza: {len(all_tickets)}")
for ticket in all_tickets:
    print(f"\nID: {ticket['id']}")
    print(f"  Başlık: {ticket['title']}")
    print(f"  Durum: {ticket['status']}")
    print(f"  User: {ticket['full_name']} ({ticket['email']})")
    if ticket['unit_number']:
        print(f"  Daire: {ticket['block_name']} - {ticket['unit_number']}")
    print(f"  Apartment ID: {ticket['apartment_id']}")

# Eğer sakin'in dairesi yoksa, bir daire ata
if sakin and not apartment_ids:
    print("\n" + "=" * 80)
    print("SAKİN'E DAİRE ATANIYOR")
    print("=" * 80)
    
    # Boş bir daire bul
    cursor.execute("""
        SELECT a.id, a.unit_number, b.name as block_name
        FROM apartments a
        JOIN blocks b ON a.block_id = b.id
        WHERE a.site_id = '1'
        AND NOT EXISTS (
            SELECT 1 FROM residency_history r 
            WHERE r.apartment_id = a.id AND r.status = 'active'
        )
        LIMIT 1
    """)
    empty_apt = cursor.fetchone()
    
    if empty_apt:
        print(f"\nBoş Daire Bulundu: {empty_apt['block_name']} - {empty_apt['unit_number']}")
        
        # Residency kaydı oluştur
        cursor.execute("""
            INSERT INTO residency_history (user_id, apartment_id, is_owner, move_in_date, status, created_at, updated_at)
            VALUES (%s, %s, TRUE, CURDATE(), 'active', NOW(), NOW())
        """, (sakin['id'], empty_apt['id']))
        
        db.commit()
        print(f"✅ Sakin'e daire atandı!")
    else:
        print("⚠️ Boş daire bulunamadı!")

cursor.close()
db.close()
