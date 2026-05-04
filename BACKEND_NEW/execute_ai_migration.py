#!/usr/bin/env python3
"""
Simple script to execute AI Cargo migration SQL
"""

import mysql.connector
import sys

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def main():
    print("Connecting to database...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("✓ Connected\n")
    
    with open('CREATE_AI_CARGO_TABLES.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Execute as multi-statement
    try:
        results = conn.cmd_query_iter(sql_content)
        for result in results:
            pass
        
        conn.commit()
        print("\n✓ Migration executed successfully\n")
        
        # Verify
        cursor.execute("SHOW TABLES LIKE 'resident_cargo_notifications'")
        if cursor.fetchone():
            print("✓ resident_cargo_notifications table created")
        
        cursor.execute("SHOW TABLES LIKE 'ai_extraction_logs'")
        if cursor.fetchone():
            print("✓ ai_extraction_logs table created")
        
        cursor.execute("SHOW COLUMNS FROM packages LIKE 'ai_extracted'")
        if cursor.fetchone():
            print("✓ packages.ai_extracted column added")
        
        print("\n✓ All tables created successfully!")
        
    except mysql.connector.Error as err:
        print(f"✗ Error: {err}")
        conn.rollback()
        return 1
    finally:
        cursor.close()
        conn.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
