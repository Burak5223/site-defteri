import mysql.connector

try:
    conn = mysql.connector.connect(
        host='localhost',
        database='smart_site_management',
        user='root',
        password='Hilton5252.'
    )
    
    cursor = conn.cursor()
    
    print("Creating sms_verification_codes table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sms_verification_codes (
            id VARCHAR(36) PRIMARY KEY,
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
        CREATE TABLE IF NOT EXISTS user_sessions (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
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
    else:
        print("✗ sms_verification_codes NOT FOUND")
    
    cursor.execute("SHOW TABLES LIKE 'user_sessions'")
    if cursor.fetchone():
        print("✓ user_sessions exists")
    else:
        print("✗ user_sessions NOT FOUND")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Done!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
