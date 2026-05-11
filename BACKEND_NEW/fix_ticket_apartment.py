import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

# Get sakin's apartment
cursor.execute("""
    SELECT apartment_id
    FROM residency_history
    WHERE user_id = (SELECT id FROM users WHERE email = 'sakin@site.com')
    AND status = 'active'
    LIMIT 1
""")

residency = cursor.fetchone()
if residency:
    apartment_id = residency['apartment_id']
    print(f"✅ Sakin's apartment ID: {apartment_id}")
    
    # Update all tickets without apartment_id to sakin's apartment
    cursor.execute("""
        UPDATE tickets
        SET apartment_id = %s
        WHERE apartment_id IS NULL
    """, (apartment_id,))
    
    conn.commit()
    print(f"✅ Updated {cursor.rowcount} tickets with apartment_id")
    
    # Verify
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM tickets
        WHERE apartment_id = %s
    """, (apartment_id,))
    
    result = cursor.fetchone()
    print(f"✅ Total tickets for this apartment: {result['count']}")
else:
    print("❌ No active residency found for sakin")

cursor.close()
conn.close()
