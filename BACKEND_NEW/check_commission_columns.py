import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Check commission columns
cursor.execute('SHOW COLUMNS FROM payments LIKE "%commission%"')
print('Commission columns in payments table:')
for row in cursor.fetchall():
    print(row)

# Check commission data
cursor.execute('SELECT COUNT(*), SUM(system_commission_amount) FROM payments WHERE status="tamamlandi"')
result = cursor.fetchone()
print(f'\nTotal completed payments: {result[0]}')
print(f'Total commission: {result[1]}')

# Check sample payments
cursor.execute('SELECT id, amount, system_commission_amount, status FROM payments LIMIT 5')
print('\nSample payments:')
for row in cursor.fetchall():
    print(f'ID: {row[0]}, Amount: {row[1]}, Commission: {row[2]}, Status: {row[3]}')

conn.close()
