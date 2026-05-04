#!/usr/bin/env python3
"""
AI Cargo Registration System - Database Migration Script
Creates tables for AI-powered cargo registration with resident notifications
"""

import mysql.connector
import sys
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hilton5252.',
    'database': 'smart_site_management'
}

def execute_sql_file(cursor, filename):
    """Execute SQL commands from a file"""
    print(f"\n{'='*60}")
    print(f"Executing: {filename}")
    print(f"{'='*60}\n")
    
    with open(filename, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Split by semicolon and execute each statement
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip() and not stmt.strip().startswith('--')]
    
    errors = []
    for i, statement in enumerate(statements, 1):
        if statement:
            try:
                cursor.execute(statement)
                # Consume any results to avoid "Unread result found" error
                try:
                    cursor.fetchall()
                except:
                    pass
                print(f"✓ Statement {i} executed successfully")
            except mysql.connector.Error as err:
                # Ignore duplicate key/index errors (1061, 1062)
                if err.errno in (1061, 1062):
                    print(f"⚠ Statement {i}: Index/key already exists (skipped)")
                else:
                    print(f"✗ Error in statement {i}: {err}")
                    print(f"Statement: {statement[:100]}...")
                    errors.append((i, err))
    
    return len(errors) == 0

def verify_tables(cursor):
    """Verify that all tables were created successfully"""
    print(f"\n{'='*60}")
    print("Verifying Tables")
    print(f"{'='*60}\n")
    
    tables_to_check = [
        'resident_cargo_notifications',
        'ai_extraction_logs',
        'packages'
    ]
    
    for table in tables_to_check:
        cursor.execute(f"SHOW TABLES LIKE '{table}'")
        result = cursor.fetchone()
        if result:
            print(f"✓ Table '{table}' exists")
            
            # Show column count
            cursor.execute(f"SHOW COLUMNS FROM {table}")
            columns = cursor.fetchall()
            print(f"  └─ {len(columns)} columns")
        else:
            print(f"✗ Table '{table}' NOT FOUND")
    
    # Check packages table for new columns
    print(f"\n{'='*60}")
    print("Checking packages table AI columns")
    print(f"{'='*60}\n")
    
    cursor.execute("SHOW COLUMNS FROM packages LIKE 'ai_%'")
    ai_columns = cursor.fetchall()
    
    expected_columns = ['ai_extracted', 'ai_extraction_log_id']
    for col_name in expected_columns:
        cursor.execute(f"SHOW COLUMNS FROM packages LIKE '{col_name}'")
        result = cursor.fetchone()
        if result:
            print(f"✓ Column 'packages.{col_name}' exists")
        else:
            print(f"✗ Column 'packages.{col_name}' NOT FOUND")
    
    # Check for other new columns
    other_columns = ['raw_tracking_number_hash', 'matched_notification_id']
    for col_name in other_columns:
        cursor.execute(f"SHOW COLUMNS FROM packages LIKE '{col_name}'")
        result = cursor.fetchone()
        if result:
            print(f"✓ Column 'packages.{col_name}' exists")
        else:
            print(f"✗ Column 'packages.{col_name}' NOT FOUND")

def show_table_stats(cursor):
    """Show statistics for the new tables"""
    print(f"\n{'='*60}")
    print("Table Statistics")
    print(f"{'='*60}\n")
    
    tables = ['resident_cargo_notifications', 'ai_extraction_logs']
    
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"Table '{table}': {count} rows")
        except mysql.connector.Error as err:
            print(f"Error checking {table}: {err}")

def main():
    """Main execution function"""
    print(f"\n{'#'*60}")
    print("AI CARGO REGISTRATION SYSTEM - DATABASE MIGRATION")
    print(f"{'#'*60}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Database: {DB_CONFIG['database']}")
    print(f"{'#'*60}\n")
    
    try:
        # Connect to database
        print("Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✓ Connected successfully\n")
        
        # Execute migration SQL
        success = execute_sql_file(cursor, 'CREATE_AI_CARGO_TABLES.sql')
        
        if success:
            conn.commit()
            print("\n✓ Migration committed successfully")
            
            # Verify tables
            verify_tables(cursor)
            
            # Show statistics
            show_table_stats(cursor)
            
            print(f"\n{'='*60}")
            print("MIGRATION COMPLETED SUCCESSFULLY")
            print(f"{'='*60}\n")
            
            return 0
        else:
            conn.rollback()
            print("\n✗ Migration failed, rolled back")
            return 1
            
    except mysql.connector.Error as err:
        print(f"\n✗ Database error: {err}")
        return 1
    except FileNotFoundError:
        print(f"\n✗ SQL file not found: CREATE_AI_CARGO_TABLES.sql")
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return 1
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
            print("Database connection closed")

if __name__ == "__main__":
    sys.exit(main())
