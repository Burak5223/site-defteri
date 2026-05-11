import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== SAKİN KULLANICI PROFİL KONTROLÜ ===\n")

# Check user basic info
cursor.execute("""
    SELECT id, full_name, email, phone, site_id, status
    FROM users 
    WHERE email = 'sakin@site.com'
""")
user = cursor.fetchone()

if user:
    print("✓ Kullanıcı bulundu:")
    print(f"  ID: {user['id']}")
    print(f"  Ad: {user['full_name']}")
    print(f"  Email: {user['email']}")
    print(f"  Telefon: {user['phone']}")
    print(f"  Site ID: {user['site_id']}")
    print(f"  Durum: {user['status']}")
    
    user_id = user['id']
    
    # Check residency_history
    print("\n--- Residency History Kontrolü ---")
    cursor.execute("""
        SELECT rh.id, rh.apartment_id, rh.status, rh.move_in_date, rh.move_out_date,
               a.block_name, a.unit_number
        FROM residency_history rh
        LEFT JOIN apartments a ON rh.apartment_id = a.id
        WHERE rh.user_id = %s
        ORDER BY rh.move_in_date DESC
    """, (user_id,))
    
    residencies = cursor.fetchall()
    if residencies:
        print(f"✓ {len(residencies)} kayıt bulundu:")
        for r in residencies:
            print(f"  - Daire: {r['block_name']} {r['unit_number']}")
            print(f"    Apartment ID: {r['apartment_id']}")
            print(f"    Durum: {r['status']}")
            print(f"    Giriş: {r['move_in_date']}")
            print(f"    Çıkış: {r['move_out_date']}")
    else:
        print("✗ Residency history kaydı YOK!")
    
    # Check user_site_memberships
    print("\n--- Site Üyelik Kontrolü ---")
    cursor.execute("""
        SELECT site_id, role, status
        FROM user_site_memberships
        WHERE user_id = %s
    """, (user_id,))
    
    memberships = cursor.fetchall()
    if memberships:
        print(f"✓ {len(memberships)} üyelik bulundu:")
        for m in memberships:
            print(f"  - Site: {m['site_id']}, Rol: {m['role']}, Durum: {m['status']}")
    else:
        print("✗ Site üyeliği YOK!")
    
    # Check if phone is missing
    print("\n--- Eksik Alanlar ---")
    issues = []
    if not user['phone']:
        issues.append("Telefon numarası eksik")
    if not residencies or not any(r['status'] == 'active' for r in residencies):
        issues.append("Aktif daire kaydı yok")
    
    if issues:
        print("✗ Sorunlar:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✓ Tüm gerekli alanlar dolu")
        
else:
    print("✗ Kullanıcı bulunamadı!")

cursor.close()
conn.close()
