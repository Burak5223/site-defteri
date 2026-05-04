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
with open('BACKEND_NEW/CREATE_INCOMES_TABLE.sql', 'r', encoding='utf-8') as f:
    sql_commands = f.read().split(';')
    
    for command in sql_commands:
        command = command.strip()
        if command:
            try:
                cursor.execute(command)
                print(f"✓ Executed: {command[:50]}...")
            except Exception as e:
                print(f"✗ Error: {e}")

conn.commit()
cursor.close()
conn.close()

print("\n✅ Incomes table created successfully!")
