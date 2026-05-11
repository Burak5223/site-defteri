import mysql.connector
from datetime import datetime

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== MEVCUT ÖDEMEYİ ONAYLA ===\n")

# Bekleyen ödemeyi bul
cursor.execute("""
    SELECT id, due_id, amount, payment_method, status
    FROM payments
    WHERE status = 'bekliyor'
    ORDER BY created_at DESC
    LIMIT 1
""")
payment = cursor.fetchone()

if payment:
    print(f"Bekleyen ödeme bulundu:")
    print(f"  ID: {payment['id']}")
    print(f"  Tutar: {payment['amount']} TL")
    print(f"  Yöntem: {payment['payment_method']}")
    
    # Ödemeyi onayla
    now = datetime.now()
    receipt_number = f"FIS-{int(now.timestamp() * 1000)}"
    
    cursor.execute("""
        UPDATE payments
        SET status = 'tamamlandi',
            payment_date = %s,
            receipt_number = %s
        WHERE id = %s
    """, (now, receipt_number, payment['id']))
    
    # Aidatı güncelle
    cursor.execute("""
        UPDATE dues
        SET status = 'odendi'
        WHERE id = %s
    """, (payment['due_id'],))
    
    conn.commit()
    
    print(f"\n✓ Ödeme onaylandı!")
    print(f"  Makbuz No: {receipt_number}")
    print(f"  Ödeme Tarihi: {now}")
    print(f"  Aidat durumu: odendi")
else:
    print("Bekleyen ödeme bulunamadı")

cursor.close()
conn.close()
