#!/usr/bin/env python3
"""
Apply delivery code migration
Adds delivery_code field to packages and resident_cargo_notifications tables
"""

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def apply_migration():
    """Apply delivery code migration"""
    
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'smart_site_management')
    )
    
    cursor = conn.cursor()
    
    try:
        print("=" * 60)
        print("DELIVERY CODE MIGRATION")
        print("=" * 60)
        
        # 1. Add delivery_code to packages table
        print("\n1. Adding delivery_code to packages table...")
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'packages' 
            AND COLUMN_NAME = 'delivery_code'
        """, (os.getenv('DB_NAME', 'smart_site_management'),))
        
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                ALTER TABLE packages 
                ADD COLUMN delivery_code VARCHAR(50) NULL 
                COMMENT 'Kargo şirketinden gelen teslim kodu (opsiyonel)'
            """)
            cursor.execute("""
                CREATE INDEX idx_packages_delivery_code ON packages(delivery_code)
            """)
            print("   ✓ delivery_code added to packages table")
        else:
            print("   ✓ delivery_code already exists in packages table")
        
        # 2. Add delivery_code to resident_cargo_notifications table
        print("\n2. Adding delivery_code to resident_cargo_notifications table...")
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'resident_cargo_notifications' 
            AND COLUMN_NAME = 'delivery_code'
        """, (os.getenv('DB_NAME', 'smart_site_management'),))
        
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                ALTER TABLE resident_cargo_notifications 
                ADD COLUMN delivery_code VARCHAR(50) NULL 
                COMMENT 'Teslim kodu (kargo şirketinden gelen kod)'
            """)
            cursor.execute("""
                CREATE INDEX idx_resident_cargo_notifications_delivery_code 
                ON resident_cargo_notifications(delivery_code)
            """)
            print("   ✓ delivery_code added to resident_cargo_notifications table")
        else:
            print("   ✓ delivery_code already exists in resident_cargo_notifications table")
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print("✓ MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\nDelivery code feature is now available!")
        print("- Residents can enter delivery codes when creating notifications")
        print("- Security will see the code when delivering packages")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    apply_migration()
