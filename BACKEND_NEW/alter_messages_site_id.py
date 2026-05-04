import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

try:
    print("Altering messages table site_id column...")
    cursor.execute("ALTER TABLE messages MODIFY COLUMN site_id VARCHAR(36) NOT NULL")
    conn.commit()
    print("✓ Successfully altered messages.site_id to VARCHAR(36)")
except Exception as e:
    print(f"✗ Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
