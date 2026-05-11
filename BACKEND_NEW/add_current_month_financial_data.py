#!/usr/bin/env python3
"""
Add Current Month Financial Data
Bu ay için test finansal verisi ekler
"""

import mysql.connector
from mysql.connector import Error
import uuid
from datetime import datetime

def add_current_month_data():
    """Bu ay için finansal test verisi ekle"""
    
    try:
        # Database bağlantısı
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("💰 Adding Current Month Financial Data...")
            
            # Bu ay için test verileri
            current_time = datetime.now()
            
            # Gelir verileri (aidat kategorisi)
            income_data = [
                ("aidat", 50000.00, "Mayıs Aidat Gelirleri"),
                ("aidat", 25000.00, "Ek Aidat Tahsilatı"),
                ("gelir", 5000.00, "Ortak Alan Kira Geliri"),
                ("income", 3000.00, "Diğer Gelirler")
            ]
            
            # Gider verileri
            expense_data = [
                ("elektrik", 8000.00, "Mayıs Elektrik Faturası"),
                ("su", 4000.00, "Mayıs Su Faturası"),
                ("temizlik", 6000.00, "Temizlik Malzemeleri"),
                ("güvenlik", 12000.00, "Güvenlik Hizmetleri"),
                ("bakım", 3500.00, "Asansör Bakımı"),
                ("yönetim", 5000.00, "Yönetim Giderleri")
            ]
            
            # Gelir kayıtlarını ekle
            print("\n📈 Adding Income Records:")
            for category, amount, description in income_data:
                expense_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO expenses (id, site_id, category, amount, currency_code, expense_date, description, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (expense_id, "1", category, amount, "TRY", current_time.date(), description, "approved", current_time, current_time))
                print(f"  ✅ {category}: ₺{amount:,.2f} - {description}")
            
            # Gider kayıtlarını ekle
            print("\n📉 Adding Expense Records:")
            for category, amount, description in expense_data:
                expense_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO expenses (id, site_id, category, amount, currency_code, expense_date, description, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (expense_id, "1", category, amount, "TRY", current_time.date(), description, "approved", current_time, current_time))
                print(f"  ✅ {category}: ₺{amount:,.2f} - {description}")
            
            # Değişiklikleri kaydet
            connection.commit()
            
            # Özet bilgileri
            total_income = sum(amount for _, amount, _ in income_data)
            total_expense = sum(amount for _, amount, _ in expense_data)
            balance = total_income - total_expense
            
            print(f"\n📊 Summary:")
            print(f"  Total Income: ₺{total_income:,.2f}")
            print(f"  Total Expense: ₺{total_expense:,.2f}")
            print(f"  Balance: ₺{balance:,.2f}")
            
            print(f"\n✅ Successfully added {len(income_data)} income and {len(expense_data)} expense records for current month")
            
    except Error as e:
        print(f"❌ Database error: {e}")
        if connection.is_connected():
            connection.rollback()
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    add_current_month_data()