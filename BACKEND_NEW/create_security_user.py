import mysql.connector
from werkzeug.security import generate_password_hash

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

try:
    # Check if security user exists
    cursor.execute("SELECT id FROM users WHERE email = 'guvenlik@site.com'")
    existing = cursor.fetchone()
    
    if existing:
        print("✓ Security user already exists")
        user_id = existing[0]
    else:
        # Create security user
        print("Creating security user...")
        # Plain text password (backend uses plain text temporarily)
        password = "guvenlik123"
        
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, full_name, phone, status, email_verified, phone_verified)
            VALUES (UUID(), 'guvenlik@site.com', %s, 'Güvenlik Personeli', '+905551234568', 'aktif', 1, 1)
        """, (password,))
        
        conn.commit()
        print(f"✓ Security user created")
    
    # Verify
    cursor.execute("""
        SELECT id, email, full_name
        FROM users
        WHERE email = 'guvenlik@site.com'
    """)
    
    print("\nSecurity user details:")
    row = cursor.fetchone()
    if row:
        print(f"  ID: {row[0]}")
        print(f"  Email: {row[1]}")
        print(f"  Name: {row[2]}")
        print(f"  Role: ROLE_SECURITY (determined by email)")
    
    print("\n✓ Security user ready!")
    print("  Email: guvenlik@site.com")
    print("  Password: guvenlik123")
    
except Exception as e:
    print(f"✗ Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
