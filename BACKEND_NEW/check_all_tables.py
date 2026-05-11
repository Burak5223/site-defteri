#!/usr/bin/env python3
"""
Check all tables in the database
"""

import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def check_all_tables():
    """Check all tables"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Show all tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print("📋 All tables in database:")
        for table in tables:
            print(f"   {table[0]}")
            
        # Look for role-related tables
        role_tables = [t[0] for t in tables if 'role' in t[0].lower() or 'membership' in t[0].lower() or 'user' in t[0].lower()]
        
        print(f"\n🔍 Role/User related tables:")
        for table in role_tables:
            print(f"   {table}")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_all_tables()