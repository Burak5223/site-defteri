import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# SQL statements to add new columns
sql_statements = [
    ("photo_url", "ALTER TABLE packages ADD COLUMN photo_url TEXT COMMENT 'URL of package photo taken at reception'"),
    ("delivery_photo_url", "ALTER TABLE packages ADD COLUMN delivery_photo_url TEXT COMMENT 'URL of photo taken during delivery'"),
    ("delivery_signature_url", "ALTER TABLE packages ADD COLUMN delivery_signature_url TEXT COMMENT 'URL of signature image from recipient'"),
    ("block_id", "ALTER TABLE packages ADD COLUMN block_id CHAR(36) COMMENT 'Block ID for filtering packages by block'"),
    ("site_id", "ALTER TABLE packages ADD COLUMN site_id CHAR(36) COMMENT 'Site ID for multi-site filtering'"),
]

try:
    # Check existing columns
    cursor.execute("SHOW COLUMNS FROM packages")
    existing_columns = {row[0] for row in cursor.fetchall()}
    
    for column_name, sql in sql_statements:
        if column_name not in existing_columns:
            print(f"Adding column: {column_name}...")
            cursor.execute(sql)
            conn.commit()
            print("✓ Success")
        else:
            print(f"⊘ Column {column_name} already exists, skipping")
    
    # Update existing packages to have site_id
    print("\nUpdating existing packages with site_id...")
    cursor.execute("UPDATE packages SET site_id = '1' WHERE site_id IS NULL")
    conn.commit()
    print("✓ Success")
    
    print("\n✅ All schema updates completed successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
