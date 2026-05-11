#!/usr/bin/env python3
"""
Ticket Status Check
Açık arızaların status değerlerini kontrol eder
"""

import mysql.connector
from mysql.connector import Error

def check_ticket_status():
    """Ticket status değerlerini kontrol et"""
    
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
            
            print("🔍 Checking Ticket Status Values...")
            
            # Site 1 ticket status'larını kontrol et
            cursor.execute("""
                SELECT status, COUNT(*) as count 
                FROM tickets 
                WHERE site_id = '1' 
                GROUP BY status
                ORDER BY count DESC
            """)
            
            ticket_statuses = cursor.fetchall()
            print("\n📊 Site 1 Ticket Status Distribution:")
            for status, count in ticket_statuses:
                print(f"  {status}: {count}")
            
            # Açık arızaları detaylı kontrol et
            cursor.execute("""
                SELECT id, title, status, created_at 
                FROM tickets 
                WHERE site_id = '1' 
                AND status IN ('acik', 'open', 'islemde', 'in_progress')
                ORDER BY created_at DESC
                LIMIT 10
            """)
            
            open_tickets = cursor.fetchall()
            print(f"\n🎫 Open/In-Progress Tickets ({len(open_tickets)}):")
            for ticket in open_tickets:
                print(f"  ID: {ticket[0][:8]}..., Title: {ticket[1][:30]}, Status: {ticket[2]}, Created: {ticket[3]}")
            
            # Backend'in aradığı status değerlerini kontrol et
            print("\n🔍 Backend Status Check:")
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE site_id = '1' AND status = 'acik'")
            acik_count = cursor.fetchone()[0]
            print(f"  'acik' status: {acik_count}")
            
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE site_id = '1' AND status = 'islemde'")
            islemde_count = cursor.fetchone()[0]
            print(f"  'islemde' status: {islemde_count}")
            
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE site_id = '1' AND status = 'cozuldu'")
            cozuldu_count = cursor.fetchone()[0]
            print(f"  'cozuldu' status: {cozuldu_count}")
            
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE site_id = '1' AND status = 'kapali'")
            kapali_count = cursor.fetchone()[0]
            print(f"  'kapali' status: {kapali_count}")
            
            print(f"\n📈 Expected Open Tickets: {acik_count}")
            print(f"📈 Expected In-Progress Tickets: {islemde_count}")
            print(f"📈 Expected Total Open+InProgress: {acik_count + islemde_count}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_ticket_status()