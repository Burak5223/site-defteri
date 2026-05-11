import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== SAKİN KULLANICI PROFİL KONTROLÜ ===\n")

# 1. Kullanıcı bilgileri
cursor.execute("""
    SELECT id, email, full_name, phone, apartment_id
    FROM users 
    WHERE email = 'sakin@site.com'
""")
user = cursor.fetchone()

if user:
    print(f"Kullanıcı Bilgileri:")
    print(f"  Email: {user['email']}")
    print(f"  Ad Soyad: {user['full_name']}")
    print(f"  Telefon: {user['phone']}")
    print(f"  Apartment ID: {user['apartment_id']}")
    
    # 2. Residency history
    cursor.execute("""
        SELECT rh.id, a.unit_number, b.name as block_name, rh.move_in_date, rh.move_out_date
        FROM residency_history rh
        JOIN apartments a ON rh.apartment_id = a.id
        JOIN blocks b ON a.block_id = b.id
        WHERE rh.user_id = %s AND rh.move_out_date IS NULL
    """, (user['id'],))
    residency = cursor.fetchone()
    
    if residency:
        print(f"\n✓ Aktif Residency:")
        print(f"  Daire: {residency['block_name']} - {residency['unit_number']}")
        print(f"  Taşınma Tarihi: {residency['move_in_date']}")
    else:
        print("\n❌ Aktif residency kaydı YOK!")
    
    # 3. User site membership
    cursor.execute("""
        SELECT site_id, role_type, user_type, status
        FROM user_site_memberships
        WHERE user_id = %s
    """, (user['id'],))
    membership = cursor.fetchone()
    
    if membership:
        print(f"\n✓ Site Üyeliği:")
        print(f"  Site ID: {membership['site_id']}")
        print(f"  Rol: {membership['role_type']}")
        print(f"  Kullanıcı Tipi: {membership['user_type']}")
        print(f"  Durum: {membership['status']}")
    else:
        print("\n❌ Site üyeliği kaydı YOK!")
    
    # 4. Eksik alanları kontrol et
    print("\n=== EKSİK ALANLAR ===")
    missing = []
    if not user['phone']:
        missing.append("Telefon")
    if not user['apartment_id'] and not residency:
        missing.append("Daire bilgisi")
    
    if missing:
        print(f"❌ Eksik: {', '.join(missing)}")
    else:
        print("✓ Tüm bilgiler tam!")
        
else:
    print("❌ Kullanıcı bulunamadı!")

cursor.close()
conn.close()
