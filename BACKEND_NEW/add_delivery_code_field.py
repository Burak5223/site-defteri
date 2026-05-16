#!/usr/bin/env python3
"""
Add delivery_code field to packages table
"""

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def add_delivery_code_field():
    """Add delivery_code field to packages table"""
    
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'smart_site_management')
    )
    
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'packages' 
            AND COLUMN_NAME = 'delivery_code'
        """, (os.getenv('DB_NAME', 'smart_site_management'),))
        
        exists = cursor.fetchone()[0] > 0
        
        if exists:
            print("✓ delivery_code field already exists")
            return
        
        # Add delivery_code column
        print("Adding delivery_code field...")
        cursor.execute("""
            ALTER TABLE packages 
            ADD COLUMN delivery_code VARCHAR(50) NULL 
            COMMENT 'Kargo şirketinden gelen teslim kodu (opsiyonel)'
        """)
        
        # Add index
        print("Adding index...")
        cursor.execute("""
            CREATE INDEX idx_packages_delivery_code ON packages(delivery_code)
        """)
        
        conn.commit()
        print("✓ delivery_code field added successfully")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    add_delivery_code_field()
