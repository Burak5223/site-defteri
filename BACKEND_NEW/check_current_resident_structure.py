import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=== Apartments Table Structure ===")
cursor.execute("DESCRIBE apartments")
for col in cursor.fetchall():
    print(f"  {col[0]} - {col[1]}")

print("\n=== Users Table Structure ===")
cursor.execute("DESCRIBE users")
for col in cursor.fetchall():
    print(f"  {col[0]} - {col[1]}")

print("\n=== User Site Memberships Table Structure ===")
cursor.execute("DESCRIBE user_site_memberships")
for col in cursor.fetchall():
    print(f"  {col[0]} - {col[1]}")

print("\n=== Sample Data from A Blok ===")
cursor.execute("""
    SELECT 
        a.unit_number,
        a.owner_user_id,
        a.current_resident_id,
        u1.full_name as owner_name,
        u2.full_name as resident_name
    FROM apartments a
    LEFT JOIN users u1 ON a.owner_user_id = u1.id
    LEFT JOIN users u2 ON a.current_resident_id = u2.id
    WHERE a.block_name = 'A Blok'
    ORDER BY a.unit_number
    LIMIT 10
""")

for row in cursor.fetchall():
    unit, owner_id, resident_id, owner_name, resident_name = row
    print(f"\nDaire {unit}:")
    print(f"  Owner: {owner_name} ({owner_id})")
    print(f"  Resident: {resident_name} ({resident_id})")

cursor.close()
conn.close()
