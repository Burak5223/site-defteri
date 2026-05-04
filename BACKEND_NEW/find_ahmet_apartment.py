import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()
cursor.execute("""
    SELECT a.id, a.unit_number, u.full_name 
    FROM apartments a 
    JOIN users u ON a.current_resident_id = u.id 
    WHERE u.email='ahmetyilmaz@site.com'
""")

row = cursor.fetchone()
if row:
    print(f"Apartment ID: {row[0]}")
    print(f"Unit Number: {row[1]}")
    print(f"Resident: {row[2]}")
else:
    print("No apartment found for ahmetyilmaz@site.com")

conn.close()
