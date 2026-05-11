import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor(dictionary=True, buffered=True)

print("=== RESIDENCY HISTORY DEBUG ===\n")

# Get user ID
cursor.execute("SELECT id FROM users WHERE email = 'sakin@site.com'")
user = cursor.fetchone()
user_id = user['id']

print(f"User ID: {user_id}\n")

# Check residency_history table structure
cursor.execute("SHOW COLUMNS FROM residency_history")
columns = cursor.fetchall()
print("residency_history tablo yapısı:")
for col in columns:
    print(f"  - {col['Field']}: {col['Type']}")

# Get all residency records
print("\n--- Tüm Residency Kayıtları ---")
cursor.execute("""
    SELECT * FROM residency_history 
    WHERE user_id = %s
    ORDER BY move_in_date DESC
""", (user_id,))

records = cursor.fetchall()
if records:
    for r in records:
        print(f"\nKayıt:")
        for key, value in r.items():
            print(f"  {key}: {value}")
else:
    print("Kayıt yok!")

# Test the exact query from AuthService
print("\n--- AuthService Query Test ---")
query = """
    SELECT apartment_id FROM residency_history 
    WHERE user_id = %s AND status = 'active' 
    ORDER BY move_in_date DESC LIMIT 1
"""
print(f"Query: {query}")
print(f"Params: user_id = {user_id}")

cursor.execute(query, (user_id,))
result = cursor.fetchall()

if result:
    print(f"\n✓ Sonuç bulundu: {result[0]['apartment_id']}")
else:
    print("\n✗ Sonuç bulunamadı!")
    
    # Try with different status values
    print("\nFarklı status değerleri deneniyor...")
    cursor.execute("""
        SELECT DISTINCT status FROM residency_history
    """)
    statuses = cursor.fetchall()
    print("Mevcut status değerleri:")
    for s in statuses:
        print(f"  - '{s['status']}'")

cursor.close()
conn.close()
