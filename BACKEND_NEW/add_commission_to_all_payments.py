#!/usr/bin/env python3
import mysql.connector
from decimal import Decimal

# Database connection
try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='Hilton5252.',
        database='smart_site_management'
    )
    cursor = conn.cursor()
    
    print("=== TÜM ÖDEMELERİ KOMİSYON GÜNCELLEMESİ ===\n")
    
    # Tamamlanmış ödemeleri al
    cursor.execute("""
        SELECT id, amount, system_commission_amount
        FROM payments 
        WHERE status = 'tamamlandi' 
        AND system_commission_amount = 0
        AND amount < 100000
        ORDER BY created_at DESC
    """)
    
    payments = cursor.fetchall()
    
    if payments:
        print(f"Güncellenecek ödeme sayısı: {len(payments)}")
        
        total_commission = Decimal('0')
        
        for payment in payments:
            payment_id = payment[0]
            amount = payment[1]
            
            # %2 komisyon hesapla
            commission_amount = amount * Decimal('0.02')
            total_commission += commission_amount
            
            # Komisyonu güncelle
            cursor.execute("""
                UPDATE payments 
                SET system_commission_amount = %s
                WHERE id = %s
            """, (commission_amount, payment_id))
            
            print(f"Ödeme {payment_id[:8]}... - Tutar: {amount} TL - Komisyon: {commission_amount} TL")
        
        conn.commit()
        
        print(f"\n✅ {len(payments)} ödeme güncellendi!")
        print(f"Toplam eklenen komisyon: {total_commission} TL")
        
        # Kontrol et
        cursor.execute("""
            SELECT COUNT(*) as payment_count, 
                   SUM(amount) as total_amount,
                   SUM(system_commission_amount) as total_commission
            FROM payments 
            WHERE status = 'tamamlandi'
        """)
        
        result = cursor.fetchone()
        print(f"\nSon durum:")
        print(f"Tamamlanmış ödeme sayısı: {result[0]}")
        print(f"Toplam ödeme tutarı: {result[1]} TL")
        print(f"Toplam komisyon: {result[2]} TL")
        
    else:
        print("Güncellenecek ödeme bulunamadı!")

except mysql.connector.Error as err:
    print(f"Veritabanı hatası: {err}")
except Exception as e:
    print(f"Genel hata: {e}")
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
        print("\nVeritabanı bağlantısı kapatıldı.")