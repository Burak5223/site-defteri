import mysql.connector
import uuid
from datetime import datetime, date

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

# 1. Sakin kullanıcısını bul
cursor.execute("SELECT id, email, full_name FROM users WHERE email = 'sakin@site.com'")
user = cursor.fetchone()

if not user:
    print("❌ Kullanıcı bulunamadı!")
    exit()

print(f"✓ Kullanıcı: {user['email']} - {user['full_name']}")
user_id = user['id']

# 2. A Blok 12 numaralı daireyi bul
cursor.execute("""
    SELECT a.id, a.unit_number, b.name as block_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE b.name = 'A Blok' AND a.unit_number = '12'
""")
apartment = cursor.fetchone()

if not apartment:
    print("❌ A Blok 12 numaralı daire bulunamadı!")
    exit()

print(f"✓ Daire: {apartment['block_name']} - {apartment['unit_number']}")
apartment_id = apartment['id']

# 3. Mevcut residency kaydını kontrol et
cursor.execute("""
    SELECT id FROM residency_history
    WHERE user_id = %s AND apartment_id = %s AND move_out_date IS NULL
""", (user_id, apartment_id))
existing = cursor.fetchone()

if existing:
    print("✓ Kullanıcı zaten bu dairede kayıtlı!")
else:
    # 4. Yeni residency kaydı oluştur
    residency_id = str(uuid.uuid4())
    now = datetime.now()
    today = date.today()
    
    cursor.execute("""
        INSERT INTO residency_history 
        (id, apartment_id, user_id, is_owner, move_in_date, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (residency_id, apartment_id, user_id, 1, today, 'aktif', now, now))
    
    conn.commit()
    print(f"✓ Kullanıcı A Blok 12'ye atandı! (Residency ID: {residency_id})")

# 5. Bu daireye atanan aidatları kontrol et
cursor.execute("""
    SELECT id, base_amount, total_amount, due_date, status
    FROM dues
    WHERE apartment_id = %s
    ORDER BY created_at DESC
""", (apartment_id,))
dues = cursor.fetchall()

if dues:
    print(f"\n✓ Bu daireye {len(dues)} aidat atanmış:")
    for due in dues:
        print(f"  - {due['total_amount']} TL, Vade: {due['due_date']}, Durum: {due['status']}")
else:
    print("\n❌ Bu daireye henüz aidat atanmamış!")

cursor.close()
conn.close()
