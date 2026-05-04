import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

# Read SQL file
with open('CREATE_FIREBASE_TABLES.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Split by semicolon and execute each statement
statements = sql_content.split(';')

for statement in statements:
    statement = statement.strip()
    if statement and not statement.startswith('--'):
        try:
            cursor.execute(statement)
            print(f"✅ Executed: {statement[:50]}...")
        except Exception as e:
            print(f"❌ Error: {e}")
            print(f"Statement: {statement[:100]}")

conn.commit()
cursor.close()
conn.close()

print("\n✅ Firebase tables migration completed!")
