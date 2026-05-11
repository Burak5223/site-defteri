#!/usr/bin/env python3

import mysql.connector

def check_pending_dues():
    """Check pending dues in the database"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        print("🔍 Checking dues table structure and data...")
        
        # Check if dues table exists
        cursor.execute("SHOW TABLES LIKE 'dues'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ Dues table does not exist")
            return
        
        # Check table structure
        cursor.execute("DESCRIBE dues")
        columns = cursor.fetchall()
        print(f"\n📊 Dues table structure:")
        for col in columns:
            print(f"   {col[0]} - {col[1]} - {col[2]}")
        
        # Check total dues count
        cursor.execute("SELECT COUNT(*) FROM dues")
        total_dues = cursor.fetchone()[0]
        print(f"\n📊 Total dues in database: {total_dues}")
        
        if total_dues == 0:
            print("⚠️ No dues found in database - this is why dashboard shows 0")
            print("💡 Need to create some test dues data")
            return
        
        # Check dues by status
        cursor.execute("""
            SELECT status, COUNT(*) as count, SUM(total_amount) as total_amount
            FROM dues 
            GROUP BY status
        """)
        status_counts = cursor.fetchall()
        
        print(f"\n📊 Dues by status:")
        for status, count, amount in status_counts:
            print(f"   {status}: {count} dues, ₺{amount or 0}")
        
        # Check dues by site
        cursor.execute("""
            SELECT d.site_id, COUNT(*) as count, SUM(d.total_amount) as total_amount
            FROM dues d
            GROUP BY d.site_id
        """)
        site_counts = cursor.fetchall()
        
        print(f"\n📊 Dues by site:")
        for site_id, count, amount in site_counts:
            print(f"   Site {site_id}: {count} dues, ₺{amount or 0}")
        
        # Check recent dues
        cursor.execute("""
            SELECT id, apartment_id, total_amount, status, due_date, created_at
            FROM dues 
            ORDER BY created_at DESC 
            LIMIT 10
        """)
        recent_dues = cursor.fetchall()
        
        print(f"\n📊 Recent dues (last 10):")
        for due in recent_dues:
            print(f"   ID: {due[0]}, Apt: {due[1]}, Amount: ₺{due[2]}, Status: {due[3]}, Due: {due[4]}")
        
        # Check pending dues specifically
        cursor.execute("""
            SELECT COUNT(*) as pending_count, SUM(total_amount) as pending_amount
            FROM dues 
            WHERE status IN ('bekliyor', 'pending', 'unpaid', 'odenmedi')
        """)
        pending_result = cursor.fetchone()
        pending_count, pending_amount = pending_result
        
        print(f"\n🎯 Pending dues summary:")
        print(f"   Count: {pending_count}")
        print(f"   Total Amount: ₺{pending_amount or 0}")
        
        return {
            'total_dues': total_dues,
            'pending_count': pending_count,
            'pending_amount': pending_amount or 0
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
    check_pending_dues()