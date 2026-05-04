import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root', 
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()
cursor.execute("""
    SELECT u.id, u.full_name, u.email, s.name as site_name 
    FROM users u 
    JOIN user_site_memberships usm ON u.id = usm.user_id 
    JOIN sites s ON usm.site_id = s.id 
    WHERE usm.role_type = 'yonetici' 
    ORDER BY u.full_name
""")

results = cursor.fetchall()
print('=== TUM YONETICILER ===')
for r in results:
    print(f'{r[0]} | {r[1]} | {r[2]} | Site: {r[3]}')

cursor.close()
conn.close()
