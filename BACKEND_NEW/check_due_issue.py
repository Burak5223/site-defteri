import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== SAKIN KULLANICI KONTROLÜ ===")
cursor.execute("""
    SELECT u.id, u.email, u.full_name, u.phone,
           usm.apartment_id, usm.role as membership_role,
           a.apartment_number, b.name as block_name
    FROM users u
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id
    LEFT JOIN apartments a ON usm.apartment_id = a.id
    LEFT JOIN blocks b ON a.block_id = b.id
    WHERE u.email = 'sakin@test'
""")
user = cursor.fetchone()

if user:
    print(f"\n✓ Kullanıcı Bulundu:")
    print(f"  ID: {user['id']}")
    print(f"  Email: {user['email']}")
    print(f"  İsim: {user['full_name']}")
    print(f"  Telefon: {user['phone']}")
    print(f"  Rol: {user['membership_role']}")
    print(f"  Daire: {user['block_name']} - {user['apartment_number']}")
    print(f"  Apartment ID: {user['apartment_id']}")
    
    user_id = user['id']
    apartment_id = user['apartment_id']
    
    print("\n=== BU KULLANICIYA ATANAN AİDATLAR ===")
    cursor.execute("""
        SELECT d.id, d.title, d.description, d.amount, d.due_date, d.status,
               d.apartment_id, d.user_id, d.created_at
        FROM dues d
        WHERE d.user_id = %s
        ORDER BY d.created_at DESC
    """, (user_id,))
    
    user_dues = cursor.fetchall()
    if user_dues:
        for due in user_dues:
            print(f"\n  Aidat ID: {due['id']}")
            print(f"  Başlık: {due['title']}")
            print(f"  Tutar: {due['amount']} TL")
            print(f"  Vade: {due['due_date']}")
            print(f"  Durum: {due['status']}")
            print(f"  Oluşturma: {due['created_at']}")
    else:
        print("  ❌ Bu kullanıcıya atanmış aidat YOK!")
    
    print("\n=== BU DAİREYE ATANAN AİDATLAR ===")
    if apartment_id:
        cursor.execute("""
            SELECT d.id, d.title, d.description, d.amount, d.due_date, d.status,
                   d.apartment_id, d.user_id, d.created_at
            FROM dues d
            WHERE d.apartment_id = %s
            ORDER BY d.created_at DESC
        """, (apartment_id,))
        
        apt_dues = cursor.fetchall()
        if apt_dues:
            for due in apt_dues:
                print(f"\n  Aidat ID: {due['id']}")
                print(f"  Başlık: {due['title']}")
                print(f"  Tutar: {due['amount']} TL")
                print(f"  Vade: {due['due_date']}")
                print(f"  Durum: {due['status']}")
                print(f"  User ID: {due['user_id']}")
                print(f"  Oluşturma: {due['created_at']}")
        else:
            print("  ❌ Bu daireye atanmış aidat YOK!")
    
    print("\n=== TÜM AİDATLAR (Son 5) ===")
    cursor.execute("""
        SELECT d.id, d.title, d.amount, d.apartment_id, d.user_id,
               a.apartment_number, b.name as block_name,
               u.email
        FROM dues d
        LEFT JOIN apartments a ON d.apartment_id = a.id
        LEFT JOIN blocks b ON a.block_id = b.id
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
        LIMIT 5
    """)
    all_dues = cursor.fetchall()
    for due in all_dues:
        print(f"\n  ID: {due['id']}")
        print(f"  Başlık: {due['title']}, Tutar: {due['amount']} TL")
        print(f"  Daire: {due['block_name']}-{due['apartment_number']}")
        print(f"  User: {due['email']}")
        print(f"  Apartment ID: {due['apartment_id']}, User ID: {due['user_id']}")

else:
    print("❌ Kullanıcı bulunamadı!")

cursor.close()
conn.close()
