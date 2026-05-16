import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Copy commission_amount to system_commission_amount
print("Copying commission_amount to system_commission_amount...")
cursor.execute('''
    UPDATE payments 
    SET system_commission_amount = commission_amount 
    WHERE commission_amount IS NOT NULL AND commission_amount > 0
''')

conn.commit()
print(f"Updated {cursor.rowcount} payments")

# Verify the update
cursor.execute('SELECT COUNT(*), SUM(system_commission_amount) FROM payments WHERE status="tamamlandi"')
result = cursor.fetchone()
print(f'\nTotal completed payments: {result[0]}')
print(f'Total commission: {result[1]}')

# Check sample payments
cursor.execute('SELECT id, amount, commission_amount, system_commission_amount, status FROM payments LIMIT 5')
print('\nSample payments after update:')
for row in cursor.fetchall():
    print(f'ID: {row[0]}, Amount: {row[1]}, commission_amount: {row[2]}, system_commission_amount: {row[3]}, Status: {row[4]}')

conn.close()
print("\n✅ Commission data fixed!")
