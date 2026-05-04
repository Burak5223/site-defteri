#!/usr/bin/env python3
"""
Fix package status values in database
"""

import mysql.connector
import sys

def main():
    try:
        # Connect to database
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='12345',
            database='site_yonetim'
        )
        cursor = conn.cursor()
        
        print("🔧 Fixing package status values...")
        
        # 1. Fix 'received' status to 'beklemede' (not delivered yet)
        cursor.execute("""
            UPDATE packages 
            SET status = 'beklemede' 
            WHERE status = 'received' 
              AND delivered_at IS NULL
        """)
        received_fixed = cursor.rowcount
        print(f"✅ Fixed {received_fixed} packages from 'received' to 'beklemede'")
        
        # 2. Fix delivered packages with wrong status
        cursor.execute("""
            UPDATE packages 
            SET status = 'teslim_edildi' 
            WHERE delivered_at IS NOT NULL 
              AND status NOT IN ('teslim_edildi', 'delivered')
        """)
        delivered_fixed = cursor.rowcount
        print(f"✅ Fixed {delivered_fixed} delivered packages")
        
        conn.commit()
        
        # 3. Show status distribution
        print("\n📊 Current status distribution:")
        cursor.execute("""
            SELECT 
                status,
                COUNT(*) as count,
                COUNT(CASE WHEN delivered_at IS NULL THEN 1 END) as not_delivered,
                COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as delivered
            FROM packages
            GROUP BY status
            ORDER BY count DESC
        """)
        
        print(f"{'Status':<25} {'Total':<10} {'Not Delivered':<15} {'Delivered':<10}")
        print("-" * 60)
        for row in cursor.fetchall():
            print(f"{row[0]:<25} {row[1]:<10} {row[2]:<15} {row[3]:<10}")
        
        # 4. Show waiting packages
        print("\n📦 Waiting packages (last 10):")
        cursor.execute("""
            SELECT 
                id,
                apartment_id,
                courier_name,
                tracking_masked,
                status,
                recorded_at,
                delivered_at
            FROM packages
            WHERE status IN ('beklemede', 'waiting', 'teslim_bekliyor', 'waiting_confirmation')
            ORDER BY recorded_at DESC
            LIMIT 10
        """)
        
        print(f"{'ID':<5} {'Apt':<5} {'Courier':<15} {'Tracking':<15} {'Status':<20} {'Recorded':<20}")
        print("-" * 90)
        for row in cursor.fetchall():
            print(f"{row[0]:<5} {row[1]:<5} {row[2] or 'N/A':<15} {row[3] or 'N/A':<15} {row[4]:<20} {str(row[5]):<20}")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Package status fix completed!")
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
