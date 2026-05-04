import mysql.connector

sql_statements = """
-- SMS Verification Codes Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Sessions Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

try:
    conn = mysql.connector.connect(
        host='localhost',
        database='smart_site_management',
        user='root',
        password='Hilton5252.'
    )
    
    cursor = conn.cursor()
    
    # Split and execute each statement
    for statement in sql_statements.split(';'):
        statement = statement.strip()
        if statement and not statement.startswith('--'):
            try:
                cursor.execute(statement)
                print(f"✓ Executed: {statement[:50]}...")
            except Exception as e:
                print(f"✗ Error: {e}")
    
    conn.commit()
    
    # Verify tables
    cursor.execute("SHOW TABLES LIKE 'sms_verification_codes'")
    if cursor.fetchone():
        print("\n✓ sms_verification_codes table created")
        cursor.execute("DESCRIBE sms_verification_codes")
        print(f"  Columns: {len(cursor.fetchall())}")
    
    cursor.execute("SHOW TABLES LIKE 'user_sessions'")
    if cursor.fetchone():
        print("✓ user_sessions table created")
        cursor.execute("DESCRIBE user_sessions")
        print(f"  Columns: {len(cursor.fetchall())}")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Phase 1 tables created successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
