import mysql.connector
from datetime import datetime, timedelta

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Total commission
cursor.execute('SELECT COUNT(*), SUM(system_commission_amount) FROM payments WHERE status="tamamlandi"')
result = cursor.fetchone()
print(f'Total completed payments: {result[0]}')
print(f'Total commission: ₺{result[1]:,.2f}')

# Current month commission
current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
next_month = current_month_start.replace(day=28) + timedelta(days=4)
current_month_end = next_month.replace(day=1) - timedelta(seconds=1)

cursor.execute('''
    SELECT COUNT(*), SUM(system_commission_amount) 
    FROM payments 
    WHERE status="tamamlandi" 
    AND payment_date >= %s 
    AND payment_date <= %s
''', (current_month_start, current_month_end))
result = cursor.fetchone()
print(f'\nCurrent month ({current_month_start.strftime("%B %Y")}):')
print(f'  Payments: {result[0]}')
print(f'  Commission: ₺{result[1] if result[1] else 0:,.2f}')

# Previous month commission
prev_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
prev_month_end = current_month_start - timedelta(seconds=1)

cursor.execute('''
    SELECT COUNT(*), SUM(system_commission_amount) 
    FROM payments 
    WHERE status="tamamlandi" 
    AND payment_date >= %s 
    AND payment_date <= %s
''', (prev_month_start, prev_month_end))
result = cursor.fetchone()
print(f'\nPrevious month ({prev_month_start.strftime("%B %Y")}):')
print(f'  Payments: {result[0]}')
print(f'  Commission: ₺{result[1] if result[1] else 0:,.2f}')

# Check payment dates distribution
cursor.execute('''
    SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') as month,
        COUNT(*) as payment_count,
        SUM(system_commission_amount) as total_commission
    FROM payments 
    WHERE status="tamamlandi"
    GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
    ORDER BY month DESC
    LIMIT 6
''')
print('\n\nMonthly breakdown:')
print('-' * 60)
for row in cursor.fetchall():
    print(f'{row[0]}: {row[1]} payments, ₺{row[2]:,.2f} commission')

conn.close()
