import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

print("=== FIXING SAKIN APARTMENT ID ===\n")

# Get sakin user
cursor.execute("""
    SELECT id, email, full_name 
    FROM users 
    WHERE email = 'sakin@site.com'
""")
sakin = cursor.fetchone()
print(f"Sakin user: {sakin['email']} (ID: {sakin['id']})")

# Get apartment from residency_history
cursor.execute("""
    SELECT apartment_id, status
    FROM residency_history
    WHERE user_id = %s
    ORDER BY created_at DESC
    LIMIT 1
""", (sakin['id'],))

residency = cursor.fetchone()
if residency:
    apartment_id = residency['apartment_id']
    print(f"Apartment from residency_history: {apartment_id}")
    print(f"Status: {residency['status']}")
    
    # Get apartment details
    cursor.execute("""
        SELECT block_name, unit_number
        FROM apartments
        WHERE id = %s
    """, (apartment_id,))
    
    apartment = cursor.fetchone()
    if apartment:
        print(f"Apartment: {apartment['block_name']} {apartment['unit_number']}")
    
    # Update user's apartment_id
    cursor.execute("""
        UPDATE users
        SET apartment_id = %s
        WHERE id = %s
    """, (apartment_id, sakin['id']))
    
    conn.commit()
    print(f"\n✓ Updated sakin user's apartment_id to: {apartment_id}")
else:
    print("✗ No residency_history found for sakin!")

# Verify
cursor.execute("""
    SELECT apartment_id
    FROM users
    WHERE id = %s
""", (sakin['id'],))

result = cursor.fetchone()
print(f"\nVerification - User apartment_id: {result['apartment_id']}")

cursor.close()
conn.close()

print("\n✓ Fix completed!")
