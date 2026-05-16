import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

# Check ticket statuses
print('=== TICKET STATUSES IN SITE 1 ===')
cursor.execute('''
    SELECT status, COUNT(*) as count
    FROM tickets
    WHERE site_id = '1'
    GROUP BY status
    ORDER BY status
''')
for row in cursor.fetchall():
    print(f'{row[0]}: {row[1]} tickets')

print('\n=== ALL TICKETS IN SITE 1 ===')
cursor.execute('''
    SELECT id, ticket_number, title, status, priority
    FROM tickets
    WHERE site_id = '1'
    ORDER BY created_at DESC
''')
for row in cursor.fetchall():
    print(f'{row[1]}: {row[2]} - Status: {row[3]}, Priority: {row[4]}')

# Count open/in-progress tickets
print('\n=== OPEN/IN-PROGRESS COUNT ===')
cursor.execute('''
    SELECT COUNT(*) as count
    FROM tickets
    WHERE site_id = '1'
    AND status IN ('acik', 'islemde')
''')
result = cursor.fetchone()
print(f'Open/In-Progress tickets: {result[0]}')

conn.close()
