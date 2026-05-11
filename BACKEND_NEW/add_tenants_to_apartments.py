import mysql.connector
import random

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor()

print("=== ADDING TENANTS TO SOME APARTMENTS ===\n")

# Get all apartments in Site 1
cursor.execute("""
    SELECT id, unit_number, block_id, owner_user_id, current_resident_id
    FROM apartments
    WHERE site_id = '1' AND (is_deleted = 0 OR is_deleted IS NULL)
    ORDER BY block_id, CAST(unit_number AS UNSIGNED)
""")

apartments = cursor.fetchall()
print(f"Total apartments: {len(apartments)}\n")

# Get all users in Site 1 (potential tenants)
cursor.execute("""
    SELECT id, full_name
    FROM users
    WHERE site_id = '1' AND (is_deleted = 0 OR is_deleted IS NULL)
    ORDER BY full_name
""")

users = cursor.fetchall()
available_tenants = [u for u in users]

print(f"Available users for tenants: {len(available_tenants)}\n")

# Add tenants to 30% of apartments (about 30 apartments)
tenant_count = int(len(apartments) * 0.3)
apartments_to_update = random.sample(apartments, tenant_count)

updated = 0
for apt_id, unit_number, block_id, owner_id, current_resident_id in apartments_to_update:
    # Skip if no owner
    if not owner_id:
        continue
    
    # Find a tenant that is not the owner
    potential_tenants = [t for t in available_tenants if t[0] != owner_id]
    
    if not potential_tenants:
        continue
    
    # Pick a random tenant
    tenant = random.choice(potential_tenants)
    tenant_id, tenant_name = tenant
    
    # Update apartment with tenant
    cursor.execute("""
        UPDATE apartments
        SET current_resident_id = %s
        WHERE id = %s
    """, (tenant_id, apt_id))
    
    updated += 1
    print(f"✓ Daire {unit_number}: Malik={owner_id[:8]}..., Kiracı={tenant_name}")

conn.commit()

print(f"\n=== SUMMARY ===")
print(f"Total apartments: {len(apartments)}")
print(f"Apartments with tenants added: {updated}")

# Verify
print("\n=== VERIFICATION ===\n")

cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(DISTINCT a.id) as total_apartments,
        SUM(CASE WHEN a.owner_user_id IS NOT NULL AND a.owner_user_id != '' THEN 1 ELSE 0 END) as with_owner,
        SUM(CASE WHEN a.current_resident_id IS NOT NULL AND a.current_resident_id != '' 
                 AND a.current_resident_id != a.owner_user_id THEN 1 ELSE 0 END) as with_different_tenant
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE a.site_id = '1' AND (a.is_deleted = 0 OR a.is_deleted IS NULL)
    GROUP BY b.name
    ORDER BY b.name
""")

results = cursor.fetchall()
for row in results:
    print(f"{row[0]}:")
    print(f"  Total: {row[1]} daire")
    print(f"  Malik var: {row[2]} daire")
    print(f"  Farklı kiracı var: {row[3]} daire")
    print()

cursor.close()
conn.close()

print("=== DONE ===")
