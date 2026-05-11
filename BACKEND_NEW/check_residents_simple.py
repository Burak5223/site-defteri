import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=== RESIDENTS IN APARTMENTS ===\n")

# Dairelerdeki sakinleri göster
cursor.execute("""
    SELECT 
        u.id,
        u.full_name,
        u.email,
        a.block_name,
        a.unit_number,
        CASE 
            WHEN a.owner_user_id = u.id THEN 'owner'
            WHEN a.current_resident_id = u.id THEN 'tenant'
        END as resident_type
    FROM users u
    JOIN apartments a ON (u.id = a.current_resident_id OR u.id = a.owner_user_id)
    WHERE a.site_id = '1'
    ORDER BY a.block_name, CAST(a.unit_number AS UNSIGNED)
    LIMIT 20
""")

residents = cursor.fetchall()
print(f"Found {len(residents)} residents in apartments:")
for r in residents:
    print(f"{r[1]} - {r[3]} Blok, Daire {r[4]} ({r[5]})")

print("\n=== CHECKING USER_SITE_MEMBERSHIPS ===\n")

# Bu kullanıcıların site membership'i var mı?
cursor.execute("""
    SELECT COUNT(DISTINCT u.id)
    FROM users u
    JOIN apartments a ON (u.id = a.current_resident_id OR u.id = a.owner_user_id)
    LEFT JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE a.site_id = '1' AND usm.id IS NULL
""")

no_membership = cursor.fetchone()[0]
print(f"Residents WITHOUT site membership: {no_membership}")

cursor.execute("""
    SELECT COUNT(DISTINCT u.id)
    FROM users u
    JOIN apartments a ON (u.id = a.current_resident_id OR u.id = a.owner_user_id)
    JOIN user_site_memberships usm ON u.id = usm.user_id
    WHERE a.site_id = '1'
""")

with_membership = cursor.fetchone()[0]
print(f"Residents WITH site membership: {with_membership}")

cursor.close()
conn.close()
