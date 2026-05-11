import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

# Get sakin user info
cursor.execute("""
    SELECT id, email, full_name
    FROM users
    WHERE email = 'sakin@site.com'
""")
sakin = cursor.fetchone()

if sakin:
    print(f"✅ Sakin User: {sakin['full_name']}")
    print(f"   User ID: {sakin['id']}")
    
    # Get sakin's apartment
    cursor.execute("""
        SELECT apartment_id
        FROM residency_history
        WHERE user_id = %s AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
    """, (sakin['id'],))
    
    residency = cursor.fetchone()
    if residency:
        apartment_id = residency['apartment_id']
        print(f"   Apartment ID: {apartment_id}")
        
        # Get apartment details
        cursor.execute("""
            SELECT block_name, unit_number
            FROM apartments
            WHERE id = %s
        """, (apartment_id,))
        
        apt = cursor.fetchone()
        if apt:
            print(f"   Apartment: {apt['block_name']} {apt['unit_number']}")
        
        # Check tickets for this apartment
        cursor.execute("""
            SELECT id, title, description, status, priority, category, 
                   apartment_id, user_id, created_at
            FROM tickets
            WHERE apartment_id = %s
            ORDER BY created_at DESC
            LIMIT 5
        """, (apartment_id,))
        
        apt_tickets = cursor.fetchall()
        print(f"\n📋 Tickets for apartment {apt['block_name']} {apt['unit_number']}:")
        if apt_tickets:
            for ticket in apt_tickets:
                print(f"   - ID: {ticket['id']}")
                print(f"     Title: {ticket['title']}")
                print(f"     Status: {ticket['status']}")
                print(f"     Category: {ticket['category']}")
                print(f"     Created: {ticket['created_at']}")
                print()
        else:
            print("   ❌ No tickets found for this apartment")
        
        # Check tickets for this user
        cursor.execute("""
            SELECT id, title, description, status, priority, category, 
                   apartment_id, user_id, created_at
            FROM tickets
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 5
        """, (sakin['id'],))
        
        user_tickets = cursor.fetchall()
        print(f"\n📋 Tickets for user {sakin['full_name']}:")
        if user_tickets:
            for ticket in user_tickets:
                print(f"   - ID: {ticket['id']}")
                print(f"     Title: {ticket['title']}")
                print(f"     Status: {ticket['status']}")
                print(f"     Apartment ID: {ticket['apartment_id']}")
                print()
        else:
            print("   ❌ No tickets found for this user")
    else:
        print("   ❌ No active residency found")
else:
    print("❌ Sakin user not found")

# Check all recent tickets
print("\n📋 All recent tickets:")
cursor.execute("""
    SELECT t.id, t.title, t.status, t.category, t.apartment_id, t.user_id,
           u.full_name as creator_name, a.block_name, a.unit_number
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN apartments a ON t.apartment_id = a.id
    ORDER BY t.created_at DESC
    LIMIT 10
""")

all_tickets = cursor.fetchall()
for ticket in all_tickets:
    print(f"   - ID: {ticket['id']}")
    print(f"     Title: {ticket['title']}")
    print(f"     Creator: {ticket['creator_name']}")
    print(f"     Apartment: {ticket['block_name']} {ticket['unit_number']}")
    print(f"     Status: {ticket['status']}")
    print()

cursor.close()
conn.close()
