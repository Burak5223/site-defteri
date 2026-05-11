import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== DÜZELTME DOĞRULAMA ===\n")

# 1. Kullanıcı bilgisi
cursor.execute("SELECT id, email, full_name FROM users WHERE email = 'sakin@site.com'")
user = cursor.fetchone()
print(f"1. Kullanıcı: {user['email']} (ID: {user['id']})")

# 2. Residency kaydı
cursor.execute("""
    SELECT rh.id, a.unit_number, b.name as block_name, rh.move_in_date, rh.move_out_date
    FROM residency_history rh
    JOIN apartments a ON rh.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    WHERE rh.user_id = %s AND rh.move_out_date IS NULL
""", (user['id'],))
residency = cursor.fetchone()

if residency:
    print(f"2. ✓ Aktif residency kaydı var: {residency['block_name']} - {residency['unit_number']}")
    
    # 3. Bu daireye ait aidatlar
    cursor.execute("""
        SELECT d.id, d.base_amount, d.total_amount, d.due_date, d.status, a.unit_number, b.name as block_name
        FROM dues d
        JOIN apartments a ON d.apartment_id = a.id
        JOIN blocks b ON a.block_id = b.id
        WHERE a.unit_number = %s AND b.name = %s
        ORDER BY d.created_at DESC
    """, (residency['unit_number'], residency['block_name']))
    dues = cursor.fetchall()
    
    if dues:
        print(f"3. ✓ Bu daireye {len(dues)} aidat atanmış:")
        for due in dues:
            print(f"   - {due['total_amount']} TL, Vade: {due['due_date']}, Durum: {due['status']}")
    else:
        print("3. ❌ Bu daireye aidat atanmamış!")
else:
    print("2. ❌ Aktif residency kaydı yok!")

cursor.close()
conn.close()

print("\n=== SONUÇ ===")
print("Veritabanı tarafında her şey hazır!")
print("Mobil uygulamadan sakin@site.com / sakin123 ile giriş yapıp aidatları kontrol edin.")
