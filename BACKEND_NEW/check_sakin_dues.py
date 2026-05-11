import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== SAKIN@SITE.COM KULLANICISI ===")
cursor.execute("SELECT id, email, full_name, phone FROM users WHERE email = 'sakin@site.com'")
user = cursor.fetchone()

if user:
    print(f"✓ Kullanıcı: {user['email']} - {user['full_name']}")
    user_id = user['id']
    
    print("\n=== KULLANICININ DAİRESİ ===")
    cursor.execute("""
        SELECT rh.apartment_id, a.unit_number, b.name as block_name
        FROM residency_history rh
        JOIN apartments a ON rh.apartment_id = a.id
        JOIN blocks b ON a.block_id = b.id
        WHERE rh.user_id = %s AND rh.move_out_date IS NULL
    """, (user_id,))
    residency = cursor.fetchone()
    
    if residency:
        print(f"✓ Daire: {residency['block_name']} - {residency['unit_number']}")
        apartment_id = residency['apartment_id']
    else:
        print("❌ Aktif daire kaydı bulunamadı!")
        apartment_id = None
    
    print("\n=== KULLANICIYA ATANAN AİDATLAR ===")
    cursor.execute("""
        SELECT id, title, amount, due_date, status, created_at
        FROM dues
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    user_dues = cursor.fetchall()
    
    if user_dues:
        for due in user_dues:
            print(f"\n  ✓ {due['title']}")
            print(f"    Tutar: {due['amount']} TL")
            print(f"    Vade: {due['due_date']}")
            print(f"    Durum: {due['status']}")
            print(f"    Oluşturma: {due['created_at']}")
    else:
        print("  ❌ Kullanıcıya atanmış aidat YOK!")
    
    if apartment_id:
        print("\n=== DAİREYE ATANAN AİDATLAR ===")
        cursor.execute("""
            SELECT id, title, amount, due_date, status, user_id, created_at
            FROM dues
            WHERE apartment_id = %s
            ORDER BY created_at DESC
        """, (apartment_id,))
        apt_dues = cursor.fetchall()
        
        if apt_dues:
            for due in apt_dues:
                print(f"\n  ✓ {due['title']}")
                print(f"    Tutar: {due['amount']} TL")
                print(f"    Vade: {due['due_date']}")
                print(f"    Durum: {due['status']}")
                print(f"    User ID: {due['user_id']}")
                print(f"    Oluşturma: {due['created_at']}")
        else:
            print("  ❌ Daireye atanmış aidat YOK!")
    
    print("\n=== SON OLUŞTURULAN 3 AİDAT ===")
    cursor.execute("""
        SELECT d.id, d.title, d.amount, d.user_id, d.apartment_id, d.created_at,
               u.email, a.unit_number, b.name as block_name
        FROM dues d
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN apartments a ON d.apartment_id = a.id
        LEFT JOIN blocks b ON a.block_id = b.id
        ORDER BY d.created_at DESC
        LIMIT 3
    """)
    recent_dues = cursor.fetchall()
    
    for due in recent_dues:
        print(f"\n  {due['title']} - {due['amount']} TL")
        print(f"    User: {due['email']}")
        print(f"    Daire: {due['block_name']}-{due['unit_number']}")
        print(f"    Oluşturma: {due['created_at']}")

else:
    print("❌ Kullanıcı bulunamadı!")

cursor.close()
conn.close()
