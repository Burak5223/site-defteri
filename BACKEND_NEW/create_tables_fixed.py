import mysql.connector

try:
    conn = mysql.connector.connect(
        host='localhost',
        database='smart_site_management',
        user='root',
        password='Hilton5252.'
    )
    
    cursor = conn.cursor()
    
    # Drop if exists
    print("Dropping existing tables if any...")
    cursor.execute("DROP TABLE IF EXISTS user_sessions")
    cursor.execute("DROP TABLE IF EXISTS sms_verification_codes")
    
    print("\nCreating sms_verification_codes table...")
    cursor.execute("""
        CREATE TABLE sms_verification_codes (
            id CHAR(36) PRIMARY KEY,
            phone_number VARCHAR(20) NOT NULL,
            verification_code VARCHAR(6) NOT NULL,
            purpose ENUM('register', 'login', 'password_reset', 'phone_change') NOT NULL DEFAULT 'register',
            is_verified BOOLEAN NOT NULL DEFAULT FALSE,
            expires_at DATETIME NOT NULL,
            verified_at DATETIME,
            attempts INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_phone_code (phone_number, verification_code),
            INDEX idx_expires (expires_at),
            INDEX idx_phone_purpose (phone_number, purpose)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✓ sms_verification_codes created")
    
    print("\nCreating user_sessions table...")
    cursor.execute("""
        CREATE TABLE user_sessions (
            id CHAR(36) PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            token_hash VARCHAR(255) NOT NULL UNIQUE,
            device_info VARCHAR(500),
            ip_address VARCHAR(45),
            expires_at DATETIME NOT NULL,
            last_activity DATETIME,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_active (user_id, is_active),
            INDEX idx_token (token_hash),
            INDEX idx_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✓ user_sessions created")
    
    conn.commit()
    
    # Verify
    print("\nVerifying tables...")
    cursor.execute("SHOW TABLES LIKE 'sms_verification_codes'")
    if cursor.fetchone():
        print("✓ sms_verification_codes exists")
        cursor.execute("SELECT COUNT(*) FROM sms_verification_codes")
        print(f"  Rows: {cursor.fetchone()[0]}")
    
    cursor.execute("SHOW TABLES LIKE 'user_sessions'")
    if cursor.fetchone():
        print("✓ user_sessions exists")
        cursor.execute("SELECT COUNT(*) FROM user_sessions")
        print(f"  Rows: {cursor.fetchone()[0]}")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Phase 1 tables created successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
