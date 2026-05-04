import mysql.connector

try:
    conn = mysql.connector.connect(
        host='localhost',
        database='smart_site_management',
        user='root',
        password='Hilton5252.'
    )
    
    cursor = conn.cursor()
    
    # Check specific tables
    print("\nChecking Phase 1 tables:")
    
    cursor.execute("SHOW TABLES LIKE 'sms_verification_codes'")
    result = cursor.fetchone()
    if result:
        print(f"✓ Found: {result[0]}")
        cursor.execute("DESCRIBE sms_verification_codes")
        cols = cursor.fetchall()
        print(f"  Columns: {len(cols)}")
        for col in cols:
            print(f"    - {col[0]} ({col[1]})")
    else:
        print("✗ sms_verification_codes NOT FOUND")
    
    print()
    
    cursor.execute("SHOW TABLES LIKE 'user_sessions'")
    result = cursor.fetchone()
    if result:
        print(f"✓ Found: {result[0]}")
        cursor.execute("DESCRIBE user_sessions")
        cols = cursor.fetchall()
        print(f"  Columns: {len(cols)}")
        for col in cols:
            print(f"    - {col[0]} ({col[1]})")
    else:
        print("✗ user_sessions NOT FOUND")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
