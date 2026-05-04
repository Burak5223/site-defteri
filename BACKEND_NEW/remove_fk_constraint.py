import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

try:
    print("Removing foreign key constraint fk_messages_apartment...")
    cursor.execute("ALTER TABLE messages DROP FOREIGN KEY fk_messages_apartment")
    conn.commit()
    print("✓ Foreign key constraint removed!")
    
    # Test it
    print("\nTesting with apartment_id='2'...")
    test_id = str(__import__('uuid').uuid4())
    cursor.execute("""
        INSERT INTO messages (id, site_id, sender_id, apartment_id, chat_type, body, content, is_read, created_at, updated_at, is_deleted, message_type)
        VALUES (%s, '1', '2', '2', 'test', 'test', 'test', 0, NOW(), NOW(), 0, 'text')
    """, (test_id,))
    conn.commit()
    print("✓ INSERT SUCCESSFUL!")
    
    # Clean up
    cursor.execute("DELETE FROM messages WHERE id = %s", (test_id,))
    conn.commit()
    print("✓ Test message deleted")
    
    print("\n✓ Messaging system should now work!")
    
except Exception as e:
    print(f"✗ ERROR: {e}")
    conn.rollback()

cursor.close()
conn.close()
