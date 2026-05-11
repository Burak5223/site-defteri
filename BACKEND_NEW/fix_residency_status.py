import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== RESIDENCY STATUS GÜNCELLEME ===\n")

# Update status from 'aktif' to 'active'
cursor.execute("""
    UPDATE residency_history 
    SET status = 'active'
    WHERE user_id = (SELECT id FROM users WHERE email = 'sakin@site.com')
    AND status = 'aktif'
""")

conn.commit()
print(f"✓ Status güncellendi: {cursor.rowcount} satır etkilendi")

# Verify
cursor.execute("""
    SELECT rh.status, a.block_name, a.unit_number
    FROM residency_history rh
    LEFT JOIN apartments a ON rh.apartment_id = a.id
    WHERE rh.user_id = (SELECT id FROM users WHERE email = 'sakin@site.com')
""")

result = cursor.fetchone()
if result:
    print(f"\n✓ Güncel durum:")
    print(f"  Daire: {result[1]} {result[2]}")
    print(f"  Status: {result[0]}")

cursor.close()
conn.close()

print("\n✓ İşlem tamamlandı!")
