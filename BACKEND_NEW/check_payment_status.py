import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== ÖDEME DURUMU KONTROLÜ ===\n")

# 1. Sakin kullanıcısının aidatları
cursor.execute("""
    SELECT d.id, d.base_amount, d.total_amount, d.due_date, d.status, 
           a.unit_number, b.name as block_name
    FROM dues d
    JOIN apartments a ON d.apartment_id = a.id
    JOIN blocks b ON a.block_id = b.id
    JOIN residency_history rh ON a.id = rh.apartment_id
    JOIN users u ON rh.user_id = u.id
    WHERE u.email = 'sakin@site.com' AND rh.move_out_date IS NULL
    ORDER BY d.due_date DESC
""")
dues = cursor.fetchall()

print("Sakin kullanıcısının aidatları:")
for due in dues:
    print(f"  - {due['block_name']} {due['unit_number']}: {due['total_amount']} TL")
    print(f"    Vade: {due['due_date']}, Durum: {due['status']}")
    print(f"    ID: {due['id']}")

# 2. Bu aidatlara yapılan ödemeleri kontrol et
print("\n=== ÖDEMELER ===")
for due in dues:
    cursor.execute("""
        SELECT id, amount, payment_date, payment_method, status, transaction_id
        FROM payments
        WHERE due_id = %s
        ORDER BY payment_date DESC
    """, (due['id'],))
    payments = cursor.fetchall()
    
    if payments:
        print(f"\n{due['block_name']} {due['unit_number']} - {due['due_date']} aidatı için ödemeler:")
        for payment in payments:
            print(f"  ✓ {payment['amount']} TL, Tarih: {payment['payment_date']}")
            print(f"    Yöntem: {payment['payment_method']}, Durum: {payment['status']}")
            print(f"    Transaction ID: {payment['transaction_id']}")
    else:
        print(f"\n{due['block_name']} {due['unit_number']} - {due['due_date']}: Ödeme kaydı YOK")

cursor.close()
conn.close()
