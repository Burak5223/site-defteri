import mysql.connector
import uuid

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("Adding user_qr_token column to users table...")

try:
    # Add column
    cursor.execute("""
        ALTER TABLE users 
        ADD COLUMN user_qr_token VARCHAR(36) UNIQUE
    """)
    print("✓ Column added")
    
    # Create index
    cursor.execute("""
        CREATE INDEX idx_users_qr_token ON users(user_qr_token)
    """)
    print("✓ Index created")
    
    # Get all users without QR token
    cursor.execute("SELECT id FROM users WHERE user_qr_token IS NULL")
    users = cursor.fetchall()
    
    print(f"Found {len(users)} users without QR token")
    
    # Generate QR tokens for existing users
    for (user_id,) in users:
        qr_token = str(uuid.uuid4())
        cursor.execute("""
            UPDATE users 
            SET user_qr_token = %s 
            WHERE id = %s
        """, (qr_token, user_id))
    
    conn.commit()
    print(f"✓ Generated QR tokens for {len(users)} users")
    
    # Verify
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(user_qr_token) as with_qr
        FROM users
    """)
    result = cursor.fetchone()
    print(f"\nVerification:")
    print(f"  Total users: {result[0]}")
    print(f"  Users with QR token: {result[1]}")
    
    # Show sample
    cursor.execute("""
        SELECT id, full_name, email, user_qr_token
        FROM users
        LIMIT 5
    """)
    print(f"\nSample users:")
    for row in cursor.fetchall():
        print(f"  {row[1]} ({row[2]}): {row[3][:8]}...")
    
    print("\n✅ Migration completed successfully!")
    
except mysql.connector.Error as err:
    print(f"❌ Error: {err}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
