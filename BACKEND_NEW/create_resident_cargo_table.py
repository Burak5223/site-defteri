import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Read SQL file
with open('create_resident_cargo_notifications_table.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

try:
    cursor.execute(sql)
    conn.commit()
    print("✅ resident_cargo_notifications table created successfully!")
except Exception as e:
    print(f"❌ Error creating table: {e}")
    conn.rollback()

conn.close()
