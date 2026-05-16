import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

# Check users
print('=== USERS ===')
cursor.execute('''
    SELECT id, email
    FROM users
    WHERE email IN ('admin@site.com', 'sakin@site.com', 'security@site.com', 'cleaning@site.com')
    ORDER BY email
''')
users = {}
for row in cursor.fetchall():
    users[row[1]] = row[0]
    print(f'{row[1]}: ID={row[0]}')

# Check site_memberships
print('\n=== SITE MEMBERSHIPS ===')
cursor.execute('''
    SELECT u.email, sm.site_id, sm.role
    FROM site_memberships sm
    JOIN users u ON sm.user_id = u.id
    WHERE u.email IN ('admin@site.com', 'sakin@site.com', 'security@site.com', 'cleaning@site.com')
    ORDER BY u.email
''')
for row in cursor.fetchall():
    print(f'{row[0]}: site_id={row[1]}, role={row[2]}')

# Check residency_history
print('\n=== RESIDENCY HISTORY ===')
cursor.execute('''
    SELECT u.email, rh.apartment_id, a.site_id
    FROM residency_history rh
    JOIN users u ON rh.user_id = u.id
    JOIN apartments a ON rh.apartment_id = a.id
    WHERE u.email IN ('admin@site.com', 'sakin@site.com', 'security@site.com', 'cleaning@site.com')
    AND rh.end_date IS NULL
    ORDER BY u.email
''')
for row in cursor.fetchall():
    print(f'{row[0]}: apartment_id={row[1]}, site_id={row[2]}')

conn.close()
