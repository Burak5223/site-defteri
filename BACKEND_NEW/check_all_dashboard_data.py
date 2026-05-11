#!/usr/bin/env python3
"""
Dashboard için tüm verileri kontrol et
"""

import mysql.connector
import json

def check_dashboard_data():
    print("🔍 Dashboard için tüm verileri kontrol ediyorum...")
    
    try:
        # Database connection
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Hilton5252.',
            database='smart_site_management'
        )
        cursor = conn.cursor()
        
        print("\n📊 DASHBOARD VERİ KONTROLÜ")
        print("=" * 50)
        
        # 1. Apartmentlar (Toplam Daireler)
        print("\n1️⃣ APARTMENTLAR:")
        cursor.execute("SELECT COUNT(*) FROM apartments WHERE site_id = '1'")
        apartment_count = cursor.fetchone()[0]
        print(f"Site 1 Apartmentları: {apartment_count}")
        
        if apartment_count > 0:
            cursor.execute("SELECT id, unit_number, block_name FROM apartments WHERE site_id = '1' LIMIT 5")
            apartments = cursor.fetchall()
            print("İlk 5 apartment:")
            for apt in apartments:
                print(f"  - ID: {apt[0]}, No: {apt[1]}, Blok: {apt[2]}")
        
        # 2. Tickets (Arızalar)
        print("\n2️⃣ TİCKETLAR (ARIZALAR):")
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE site_id = '1'")
        total_tickets = cursor.fetchone()[0]
        print(f"Toplam Ticket: {total_tickets}")
        
        cursor.execute("SELECT status, COUNT(*) FROM tickets WHERE site_id = '1' GROUP BY status")
        ticket_statuses = cursor.fetchall()
        print("Ticket durumları:")
        for status, count in ticket_statuses:
            print(f"  - {status}: {count}")
        
        # 3. Expenses (Finansal Veriler)
        print("\n3️⃣ FİNANSAL VERİLER (EXPENSES):")
        cursor.execute("SELECT COUNT(*) FROM expenses WHERE site_id = '1'")
        expense_count = cursor.fetchone()[0]
        print(f"Toplam Expense kaydı: {expense_count}")
        
        if expense_count > 0:
            cursor.execute("SELECT category, SUM(amount) FROM expenses WHERE site_id = '1' GROUP BY category")
            expense_categories = cursor.fetchall()
            print("Kategori bazında toplam:")
            for category, amount in expense_categories:
                print(f"  - {category}: ₺{amount}")
        
        # 4. Users/Residents (Sakinler)
        print("\n4️⃣ KULLANICILAR (SAKİNLER):")
        cursor.execute("SELECT COUNT(*) FROM users WHERE site_id = '1'")
        user_count = cursor.fetchone()[0]
        print(f"Site 1 Kullanıcıları: {user_count}")
        
        cursor.execute("""
            SELECT r.name, COUNT(*) 
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.site_id = '1'
            GROUP BY r.name
        """)
        user_roles = cursor.fetchall()
        print("Rol bazında kullanıcılar:")
        for role, count in user_roles:
            print(f"  - {role}: {count}")
        
        # 5. Residency History (Daire-Sakin İlişkisi)
        print("\n5️⃣ RESİDENCY HİSTORY (DAİRE-SAKİN İLİŞKİSİ):")
        cursor.execute("SELECT COUNT(*) FROM residency_history WHERE status = 'active'")
        active_residencies = cursor.fetchone()[0]
        print(f"Aktif residency kayıtları: {active_residencies}")
        
        if active_residencies > 0:
            cursor.execute("""
                SELECT rh.apartment_id, a.unit_number, a.block_name, COUNT(*) as resident_count
                FROM residency_history rh
                JOIN apartments a ON rh.apartment_id = a.id
                WHERE rh.status = 'active' AND a.site_id = '1'
                GROUP BY rh.apartment_id, a.unit_number, a.block_name
                LIMIT 5
            """)
            residency_data = cursor.fetchall()
            print("İlk 5 dairenin sakin sayısı:")
            for apt_id, apt_no, block, count in residency_data:
                print(f"  - Daire {apt_no} ({block}): {count} sakin")
        
        # 6. Packages (Paketler)
        print("\n6️⃣ PAKETLER:")
        cursor.execute("SELECT COUNT(*) FROM packages WHERE site_id = '1'")
        package_count = cursor.fetchone()[0]
        print(f"Toplam Paket: {package_count}")
        
        if package_count > 0:
            cursor.execute("SELECT status, COUNT(*) FROM packages WHERE site_id = '1' GROUP BY status")
            package_statuses = cursor.fetchall()
            print("Paket durumları:")
            for status, count in package_statuses:
                print(f"  - {status}: {count}")
        
        # 7. Messages (Mesajlar)
        print("\n7️⃣ MESAJLAR:")
        cursor.execute("SELECT COUNT(*) FROM messages WHERE site_id = '1'")
        message_count = cursor.fetchone()[0]
        print(f"Toplam Mesaj: {message_count}")
        
        # 8. Announcements (Duyurular)
        print("\n8️⃣ DUYURULAR:")
        cursor.execute("SELECT COUNT(*) FROM announcements WHERE site_id = '1'")
        announcement_count = cursor.fetchone()[0]
        print(f"Toplam Duyuru: {announcement_count}")
        
        # 9. Tasks (Görevler)
        print("\n9️⃣ GÖREVLER:")
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE site_id = '1'")
        task_count = cursor.fetchone()[0]
        print(f"Toplam Görev: {task_count}")
        
        if task_count > 0:
            cursor.execute("SELECT status, COUNT(*) FROM tasks WHERE site_id = '1' GROUP BY status")
            task_statuses = cursor.fetchall()
            print("Görev durumları:")
            for status, count in task_statuses:
                print(f"  - {status}: {count}")
        
        print("\n" + "=" * 50)
        print("✅ Veri kontrolü tamamlandı!")
        
        # Öneriler
        print("\n💡 ÖNERİLER:")
        if apartment_count == 0:
            print("❌ Apartment verisi yok - test apartmentları oluşturulmalı")
        if total_tickets == 0:
            print("❌ Ticket verisi yok - test arızaları oluşturulmalı")
        if expense_count == 0:
            print("❌ Expense verisi yok - test finansal verileri oluşturulmalı")
        if task_count == 0:
            print("❌ Task verisi yok - test görevleri oluşturulmalı")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_dashboard_data()