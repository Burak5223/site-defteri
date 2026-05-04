import mysql.connector
import sys

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

try:
    print("Adding Telegram OTP fields to users table...")
    
    # Check if columns already exist
    cursor.execute("""
        SELECT COUNT(*) 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'smart_site_management' 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'telegram_chat_id'
    """)
    
    if cursor.fetchone()[0] == 0:
        # Add columns
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN telegram_chat_id BIGINT NULL,
            ADD COLUMN otp_code VARCHAR(6) NULL,
            ADD COLUMN otp_expiry DATETIME NULL,
            ADD COLUMN otp_verified BOOLEAN DEFAULT FALSE
        """)
        print("✓ Columns added successfully")
        
        # Add indexes
        cursor.execute("CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id)")
        cursor.execute("CREATE INDEX idx_users_otp_code ON users(otp_code)")
        print("✓ Indexes created successfully")
        
        conn.commit()
        print("\n✓ Database migration completed successfully!")
    else:
        print("✓ Columns already exist, skipping migration")
    
except Exception as e:
    print(f"✗ Error: {e}")
    conn.rollback()
    sys.exit(1)
finally:
    cursor.close()
    conn.close()
