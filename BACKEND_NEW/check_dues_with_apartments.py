#!/usr/bin/env python3

import mysql.connector

def check_dues_with_apartments():
    """Check dues data with apartment relationships"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        print("🔍 Checking dues with apartment relationships...")
        
        # Check dues for site 1 through apartments
        cursor.execute("""
            SELECT d.status, COUNT(*) as count, SUM(d.total_amount) as total_amount
            FROM dues d
            JOIN apartments a ON d.apartment_id = a.id
            JOIN blocks b ON a.block_id = b.id
            WHERE b.site_id = '1'
            GROUP BY d.status
        """)
        site1_dues = cursor.fetchall()
        
        print(f"\n📊 Site 1 dues by status:")
        total_pending = 0
        total_pending_amount = 0
        
        for status, count, amount in site1_dues:
            print(f"   {status}: {count} dues, ₺{amount or 0:,.2f}")
            if status in ['bekliyor', 'pending', 'unpaid', 'odenmedi']:
                total_pending += count
                total_pending_amount += (amount or 0)
        
        print(f"\n🎯 Site 1 pending dues summary:")
        print(f"   Pending Count: {total_pending}")
        print(f"   Pending Amount: ₺{total_pending_amount:,.2f}")
        
        # Check some example pending dues
        cursor.execute("""
            SELECT d.id, d.apartment_id, a.unit_number, b.name as block_name, 
                   d.total_amount, d.status, d.due_date
            FROM dues d
            JOIN apartments a ON d.apartment_id = a.id
            JOIN blocks b ON a.block_id = b.id
            WHERE b.site_id = '1' AND d.status = 'bekliyor'
            ORDER BY d.created_at DESC
            LIMIT 10
        """)
        pending_examples = cursor.fetchall()
        
        print(f"\n📋 Example pending dues in Site 1:")
        for due in pending_examples:
            print(f"   {due[3]} {due[2]} - ₺{due[4]:,.2f} - Due: {due[6]}")
        
        return {
            'pending_count': total_pending,
            'pending_amount': total_pending_amount
        }
        
    except mysql.connector.Error as error:
        print(f"❌ Database error: {error}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        try:
            if 'connection' in locals() and connection.is_connected():
                cursor.close()
                connection.close()
                print("🔌 Database connection closed")
        except:
            pass

if __name__ == "__main__":
    check_dues_with_apartments()