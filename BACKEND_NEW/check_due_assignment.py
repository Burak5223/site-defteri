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
    SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role,
           usm.apartment_id, a.apartment_number, b.name as block_name
    FROM users u
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id
    LEFT JOIN apartments a ON usm.apartment_id = a.id
    LEFT JOIN blocks b ON a.block_id = b.id
    WHERE u.username = 'sakin@test'
""")
user = cursor.fetchone()
if user:
    print(f"\nKullanıcı: {user['username']}")
    print(f"ID: {user['id']}")
    print(f"İsim: {user['first_name']} {user['last_name']}")
    print(f"Rol: {user['role']}")
    print(f"Daire: {user['block_name']} - {user['apartment_number']}")
    print(f"Apartment ID: {user['apartment_id']}")
    
    user_id = user['id']
    apartment_id = user['apartment_id']
    
    print("\n=== ATANAN AİDATLAR (dues tablosu) ===")
    cursor.execute("""
        SELECT d.id, d.title, d.amount, d.due_date, d.status,
               d.apartment_id, d.user_id,
               a.apartment_number, b.name as block_name
        FROM dues d
        LEFT JOIN apartments a ON d.apartment_id = a.id
        LEFT JOIN blocks b ON a.block_id = b.id
        WHERE d.apartment_id = %s OR d.user_id = %s
        ORDER BY d.created_at DESC
    """, (apartment_id, user_id))
    
    dues = cursor.fetchall()
    if dues:
        for due in dues:
            print(f"\nAidat ID: {due['id']}")
            print(f"Başlık: {due['title']}")
            print(f"Tutar: {due['amount']}")
            print(f"Vade: {due['due_date']}")
            print(f"Durum: {due['status']}")
            print(f"Apartment ID: {due['apartment_id']}")
            print(f"User ID: {due['user_id']}")
            print(f"Daire: {due['block_name']} - {due['apartment_number']}")
    else:
        print("❌ Hiç aidat bulunamadı!")
    
    print("\n=== TÜM AİDATLAR (kontrol için) ===")
    cursor.execute("""
        SELECT d.id, d.title, d.amount, d.apartment_id, d.user_id,
               a.apartment_number, b.name as block_name
        FROM dues d
        LEFT JOIN apartments a ON d.apartment_id = a.id
        LEFT JOIN blocks b ON a.block_id = b.id
        ORDER BY d.created_at DESC
        LIMIT 10
    """)
    all_dues = cursor.fetchall()
    for due in all_dues:
        print(f"ID: {due['id']}, Başlık: {due['title']}, Tutar: {due['amount']}, Apartment: {due['apartment_id']}, User: {due['user_id']}, Daire: {due['block_name']}-{due['apartment_number']}")

else:
    print("❌ Kullanıcı bulunamadı!")

cursor.close()
conn.close()
