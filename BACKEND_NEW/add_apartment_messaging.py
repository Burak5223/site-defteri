import mysql.connector
import sys

# Database connection
try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Hilton5252.",
        database="smart_site_management"
    )
    cursor = conn.cursor()
    print("✓ Database connected")
    
    # 1. apartment_id kolonu ekle
    print("\n=== Adding apartment_id column ===")
    try:
        cursor.execute("""
            ALTER TABLE messages 
            ADD COLUMN apartment_id VARCHAR(36) AFTER receiver_id
        """)
        print("✓ apartment_id column added")
    except mysql.connector.Error as e:
        if "Duplicate column name" in str(e):
            print("⚠ apartment_id column already exists")
        else:
            print(f"✗ Error adding column: {e}")
            raise
    
    # 2. Foreign key ekle
    print("\n=== Adding foreign key constraint ===")
    try:
        cursor.execute("""
            ALTER TABLE messages
            ADD CONSTRAINT fk_messages_apartment
            FOREIGN KEY (apartment_id) REFERENCES apartments(id)
            ON DELETE SET NULL
        """)
        print("✓ Foreign key constraint added")
    except mysql.connector.Error as e:
        if "Duplicate key name" in str(e) or "already exists" in str(e):
            print("⚠ Foreign key constraint already exists")
        else:
            print(f"✗ Error adding foreign key: {e}")
            # Don't raise, continue
    
    # 3. Index ekle
    print("\n=== Adding indexes ===")
    try:
        cursor.execute("""
            CREATE INDEX idx_messages_apartment_id ON messages(apartment_id)
        """)
        print("✓ Index idx_messages_apartment_id added")
    except mysql.connector.Error as e:
        if "Duplicate key name" in str(e):
            print("⚠ Index idx_messages_apartment_id already exists")
        else:
            print(f"✗ Error adding index: {e}")
    
    try:
        cursor.execute("""
            CREATE INDEX idx_messages_apartment_site ON messages(apartment_id, site_id, created_at)
        """)
        print("✓ Index idx_messages_apartment_site added")
    except mysql.connector.Error as e:
        if "Duplicate key name" in str(e):
            print("⚠ Index idx_messages_apartment_site already exists")
        else:
            print(f"✗ Error adding index: {e}")
    
    conn.commit()
    print("\n✓ All changes committed successfully")
    
    # Verify changes
    print("\n=== Verifying changes ===")
    cursor.execute("DESCRIBE messages")
    columns = cursor.fetchall()
    
    has_apartment_id = False
    for col in columns:
        if col[0] == 'apartment_id':
            has_apartment_id = True
            print(f"✓ apartment_id column exists: {col[1]}")
            break
    
    if not has_apartment_id:
        print("✗ apartment_id column not found!")
        sys.exit(1)
    
    # Show indexes
    cursor.execute("SHOW INDEX FROM messages WHERE Key_name LIKE '%apartment%'")
    indexes = cursor.fetchall()
    print(f"\n✓ Found {len(indexes)} apartment-related indexes:")
    for idx in indexes:
        print(f"  - {idx[2]} on column {idx[4]}")
    
    print("\n=== SUCCESS ===")
    print("Daire bazlı mesajlaşma için database hazır!")
    
except mysql.connector.Error as e:
    print(f"\n✗ Database error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n✗ Unexpected error: {e}")
    sys.exit(1)
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
        print("\n✓ Database connection closed")
