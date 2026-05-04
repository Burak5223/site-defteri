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
    
    print("=== ÖDEME KOMİSYON GÜNCELLEMESİ ===\n")
    
    # En son ödemeyi al
    cursor.execute("""
        SELECT id, amount, system_commission_amount, status
        FROM payments 
        WHERE status = 'tamamlandi'
        ORDER BY created_at DESC
        LIMIT 1
    """)
    
    payment = cursor.fetchone()
    if payment:
        payment_id = payment[0]
        amount = payment[1]
        current_commission = payment[2]
        
        print(f"Son ödeme ID: {payment_id}")
        print(f"Tutar: {amount} TL")
        print(f"Mevcut komisyon: {current_commission} TL")
        
        # %2 komisyon hesapla
        commission_amount = amount * Decimal('0.02')
        
        print(f"Hesaplanan komisyon (%2): {commission_amount} TL")
        
        # Komisyonu güncelle
        cursor.execute("""
            UPDATE payments 
            SET system_commission_amount = %s
            WHERE id = %s
        """, (commission_amount, payment_id))
        
        conn.commit()
        
        print(f"✅ Komisyon güncellendi: {commission_amount} TL")
        
        # Kontrol et
        cursor.execute("""
            SELECT id, amount, system_commission_amount
            FROM payments 
            WHERE id = %s
        """, (payment_id,))
        
        updated_payment = cursor.fetchone()
        print(f"Güncellenmiş ödeme: {updated_payment[1]} TL, Komisyon: {updated_payment[2]} TL")
        
        # Toplam komisyon kontrol
        cursor.execute("""
            SELECT SUM(system_commission_amount) as total_commission
            FROM payments 
            WHERE status = 'tamamlandi'
        """)
        
        total = cursor.fetchone()
        print(f"Toplam komisyon: {total[0]} TL")
        
    else:
        print("Tamamlanmış ödeme bulunamadı!")

except mysql.connector.Error as err:
    print(f"Veritabanı hatası: {err}")
except Exception as e:
    print(f"Genel hata: {e}")
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
        print("\nVeritabanı bağlantısı kapatıldı.")