import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Read and execute SQL
with open('CREATE_MESSAGES_TABLE.sql', 'r', encoding='utf-8') as f:
    sql = f.read()
    cursor.execute(sql)

conn.commit()
print("✓ Messages table created successfully")

cursor.close()
conn.close()
