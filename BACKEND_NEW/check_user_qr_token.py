import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True)

# Check sakin user's QR token
cursor.execute("""
    SELECT id, email, full_name, user_qr_token
    FROM users
    WHERE email = 'sakin@site.com'
""")

user = cursor.fetchone()
if user:
    print(f"✅ User found: {user['full_name']}")
    print(f"   Email: {user['email']}")
    print(f"   QR Token: {user['user_qr_token']}")
    
    if not user['user_qr_token']:
        print("\n⚠️  User has no QR token! Generating one...")
        import uuid
        qr_token = str(uuid.uuid4())
        
        cursor.execute("""
            UPDATE users
            SET user_qr_token = %s
            WHERE id = %s
        """, (qr_token, user['id']))
        conn.commit()
        
        print(f"✅ QR Token generated: {qr_token}")
else:
    print("❌ User not found")

cursor.close()
conn.close()
