#!/usr/bin/env python3
"""
Financial Data Check
Finansal verilerin neden 0 olduğunu kontrol eder
"""

import mysql.connector
from mysql.connector import Error
from datetime import datetime, date

def check_financial_data():
    """Finansal verileri kontrol et"""
    
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
            
            print("🔍 Checking Financial Data...")
            
            # Site 1 expenses kontrol et
            cursor.execute("SELECT COUNT(*) FROM expenses WHERE site_id = '1'")
            site1_expenses = cursor.fetchone()[0]
            print(f"\nSite 1 total expenses: {site1_expenses}")
            
            # Expense kategorilerini kontrol et
            cursor.execute("""
                SELECT category, COUNT(*) as count, SUM(amount) as total_amount
                FROM expenses 
                WHERE site_id = '1' 
                GROUP BY category
                ORDER BY count DESC
            """)
            
            categories = cursor.fetchall()
            print("\n📊 Site 1 Expense Categories:")
            for category, count, total in categories:
                print(f"  {category}: {count} records, Total: ₺{total}")
            
            # Bu ay verilerini kontrol et
            current_month = date.today().replace(day=1)
            next_month = (current_month.replace(month=current_month.month + 1) if current_month.month < 12 
                         else current_month.replace(year=current_month.year + 1, month=1))
            
            print(f"\n📅 Current Month: {current_month} to {next_month}")
            
            cursor.execute("""
                SELECT category, COUNT(*) as count, SUM(amount) as total_amount
                FROM expenses 
                WHERE site_id = '1' 
                AND created_at >= %s 
                AND created_at < %s
                GROUP BY category
                ORDER BY count DESC
            """, (current_month, next_month))
            
            monthly_categories = cursor.fetchall()
            print(f"\n📊 Site 1 This Month Expenses:")
            for category, count, total in monthly_categories:
                print(f"  {category}: {count} records, Total: ₺{total}")
            
            # Gelir kategorilerini kontrol et (backend'in aradığı kategoriler)
            print("\n🔍 Backend Income Category Check:")
            cursor.execute("""
                SELECT COUNT(*), SUM(amount) 
                FROM expenses 
                WHERE site_id = '1' 
                AND (category LIKE '%aidat%' OR category LIKE '%gelir%' OR category LIKE '%income%')
                AND created_at >= %s 
                AND created_at < %s
            """, (current_month, next_month))
            
            income_result = cursor.fetchone()
            print(f"  Income categories this month: {income_result[0]} records, Total: ₺{income_result[1] or 0}")
            
            # Gider kategorilerini kontrol et
            cursor.execute("""
                SELECT COUNT(*), SUM(amount) 
                FROM expenses 
                WHERE site_id = '1' 
                AND NOT (category LIKE '%aidat%' OR category LIKE '%gelir%' OR category LIKE '%income%')
                AND created_at >= %s 
                AND created_at < %s
            """, (current_month, next_month))
            
            expense_result = cursor.fetchone()
            print(f"  Expense categories this month: {expense_result[0]} records, Total: ₺{expense_result[1] or 0}")
            
            # Son eklenen expense'leri kontrol et
            cursor.execute("""
                SELECT id, category, amount, created_at 
                FROM expenses 
                WHERE site_id = '1' 
                ORDER BY created_at DESC 
                LIMIT 10
            """)
            
            recent_expenses = cursor.fetchall()
            print(f"\n💰 Recent Expenses:")
            for expense in recent_expenses:
                print(f"  ID: {expense[0][:8]}..., Category: {expense[1]}, Amount: ₺{expense[2]}, Date: {expense[3]}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_financial_data()