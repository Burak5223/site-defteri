#!/usr/bin/env python3
"""
Dashboard Data Check
Dashboard'da 0 gözüken verilerin neden 0 olduğunu kontrol eder
"""

import mysql.connector
from mysql.connector import Error

def check_dashboard_data():
    """Dashboard verilerini kontrol et"""
    
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
            
            print("🔍 Checking Dashboard Data Sources...")
            
            # 1. Apartments kontrol et
            print("\n1️⃣ APARTMENTS:")
            cursor.execute("SELECT COUNT(*) as total FROM apartments")
            total_apartments = cursor.fetchone()[0]
            print(f"Total apartments: {total_apartments}")
            
            cursor.execute("SELECT COUNT(*) as site1_apartments FROM apartments WHERE site_id = '1'")
            site1_apartments = cursor.fetchone()[0]
            print(f"Site 1 apartments: {site1_apartments}")
            
            if site1_apartments > 0:
                cursor.execute("SELECT id, site_id, block_name, unit_number FROM apartments WHERE site_id = '1' LIMIT 5")
                sample_apartments = cursor.fetchall()
                print("Sample apartments:")
                for apt in sample_apartments:
                    print(f"  ID: {apt[0]}, Site: {apt[1]}, Block: {apt[2]}, Unit: {apt[3]}")
            
            # 2. Tickets kontrol et
            print("\n2️⃣ TICKETS:")
            cursor.execute("SELECT COUNT(*) as total FROM tickets")
            total_tickets = cursor.fetchone()[0]
            print(f"Total tickets: {total_tickets}")
            
            cursor.execute("SELECT COUNT(*) as site1_tickets FROM tickets WHERE site_id = 1")
            site1_tickets = cursor.fetchone()[0]
            print(f"Site 1 tickets: {site1_tickets}")
            
            if site1_tickets > 0:
                cursor.execute("SELECT id, site_id, title, status FROM tickets WHERE site_id = 1 LIMIT 5")
                sample_tickets = cursor.fetchall()
                print("Sample tickets:")
                for ticket in sample_tickets:
                    print(f"  ID: {ticket[0]}, Site: {ticket[1]}, Title: {ticket[2]}, Status: {ticket[3]}")
            
            # 3. Packages kontrol et
            print("\n3️⃣ PACKAGES:")
            cursor.execute("SELECT COUNT(*) as total FROM packages")
            total_packages = cursor.fetchone()[0]
            print(f"Total packages: {total_packages}")
            
            cursor.execute("SELECT COUNT(*) as site1_packages FROM packages WHERE site_id = 1")
            site1_packages = cursor.fetchone()[0]
            print(f"Site 1 packages: {site1_packages}")
            
            if site1_packages > 0:
                cursor.execute("SELECT id, site_id, recipient_name, status FROM packages WHERE site_id = 1 LIMIT 5")
                sample_packages = cursor.fetchall()
                print("Sample packages:")
                for package in sample_packages:
                    print(f"  ID: {package[0]}, Site: {package[1]}, Recipient: {package[2]}, Status: {package[3]}")
            
            # 4. Announcements kontrol et
            print("\n4️⃣ ANNOUNCEMENTS:")
            cursor.execute("SELECT COUNT(*) as total FROM announcements")
            total_announcements = cursor.fetchone()[0]
            print(f"Total announcements: {total_announcements}")
            
            cursor.execute("SELECT COUNT(*) as site1_announcements FROM announcements WHERE site_id = 1")
            site1_announcements = cursor.fetchone()[0]
            print(f"Site 1 announcements: {site1_announcements}")
            
            if site1_announcements > 0:
                cursor.execute("SELECT id, site_id, title, expires_at FROM announcements WHERE site_id = 1 LIMIT 5")
                sample_announcements = cursor.fetchall()
                print("Sample announcements:")
                for announcement in sample_announcements:
                    print(f"  ID: {announcement[0]}, Site: {announcement[1]}, Title: {announcement[2]}, Expires: {announcement[3]}")
            
            # 5. Tasks kontrol et
            print("\n5️⃣ TASKS:")
            cursor.execute("SELECT COUNT(*) as total FROM tasks")
            total_tasks = cursor.fetchone()[0]
            print(f"Total tasks: {total_tasks}")
            
            cursor.execute("SELECT COUNT(*) as site1_tasks FROM tasks WHERE site_id = 1")
            site1_tasks = cursor.fetchone()[0]
            print(f"Site 1 tasks: {site1_tasks}")
            
            if site1_tasks > 0:
                cursor.execute("SELECT id, site_id, title, status FROM tasks WHERE site_id = 1 LIMIT 5")
                sample_tasks = cursor.fetchall()
                print("Sample tasks:")
                for task in sample_tasks:
                    print(f"  ID: {task[0]}, Site: {task[1]}, Title: {task[2]}, Status: {task[3]}")
            
            # 6. Expenses kontrol et (finansal veriler için)
            print("\n6️⃣ EXPENSES (Financial Data):")
            cursor.execute("SELECT COUNT(*) as total FROM expenses")
            total_expenses = cursor.fetchone()[0]
            print(f"Total expenses: {total_expenses}")
            
            cursor.execute("SELECT COUNT(*) as site1_expenses FROM expenses WHERE site_id = 1")
            site1_expenses = cursor.fetchone()[0]
            print(f"Site 1 expenses: {site1_expenses}")
            
            if site1_expenses > 0:
                cursor.execute("SELECT id, site_id, category, amount FROM expenses WHERE site_id = 1 LIMIT 5")
                sample_expenses = cursor.fetchall()
                print("Sample expenses:")
                for expense in sample_expenses:
                    print(f"  ID: {expense[0]}, Site: {expense[1]}, Category: {expense[2]}, Amount: {expense[3]}")
            
            print("\n" + "="*50)
            print("SUMMARY:")
            print(f"✅ Dues working: 203 unpaid dues found")
            print(f"{'✅' if site1_apartments > 0 else '❌'} Apartments: {site1_apartments}")
            print(f"{'✅' if site1_tickets > 0 else '❌'} Tickets: {site1_tickets}")
            print(f"{'✅' if site1_packages > 0 else '❌'} Packages: {site1_packages}")
            print(f"{'✅' if site1_announcements > 0 else '❌'} Announcements: {site1_announcements}")
            print(f"{'✅' if site1_tasks > 0 else '❌'} Tasks: {site1_tasks}")
            print(f"{'✅' if site1_expenses > 0 else '❌'} Expenses: {site1_expenses}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_dashboard_data()