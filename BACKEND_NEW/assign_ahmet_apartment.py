import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)

cursor = conn.cursor()

# Get Ahmet's user ID
cursor.execute("SELECT id, full_name FROM users WHERE email='ahmetyilmaz@site.com'")
user = cursor.fetchone()
print(f"User: {user[1]} (ID: {user[0]})")

# Get an available apartment
cursor.execute("SELECT id, unit_number FROM apartments WHERE site_id='1' AND current_resident_id IS NULL LIMIT 1")
apartment = cursor.fetchone()

if apartment:
    print(f"Assigning apartment: Unit {apartment[1]} (ID: {apartment[0]})")
    
    # Assign apartment to Ahmet
    cursor.execute("""
        UPDATE apartments 
        SET current_resident_id = %s 
        WHERE id = %s
    """, (user[0], apartment[0]))
    
    conn.commit()
    print(f"✅ Apartment assigned successfully!")
    print(f"Apartment ID to use in test: {apartment[0]}")
else:
    # If no available apartment, just use the first one
    cursor.execute("SELECT id, unit_number FROM apartments WHERE site_id='1' LIMIT 1")
    apartment = cursor.fetchone()
    print(f"Using existing apartment: Unit {apartment[1]} (ID: {apartment[0]})")
    print(f"Apartment ID to use in test: {apartment[0]}")

conn.close()
