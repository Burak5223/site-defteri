import mysql.connector

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)

cursor = conn.cursor()

print("=" * 80)
print("FİNAL DAİRE VE SAKİN DAĞILIMI")
print("=" * 80)

# Get detailed distribution by block
cursor.execute("""
    SELECT 
        b.name as block_name,
        COUNT(DISTINCT a.id) as total_apartments,
        COUNT(DISTINCT CASE WHEN rh.is_owner = TRUE THEN a.id END) as apartments_with_owners,
        COUNT(DISTINCT CASE WHEN rh.is_owner = FALSE THEN a.id END) as apartments_with_tenants,
        COUNT(DISTINCT CASE WHEN rh.is_owner = TRUE THEN rh.user_id END) as owner_count,
        COUNT(DISTINCT CASE WHEN rh.is_owner = FALSE THEN rh.user_id END) as tenant_count
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id AND rh.move_out_date IS NULL
    WHERE b.site_id = '1' AND a.is_deleted = FALSE
    GROUP BY b.id, b.name
    ORDER BY b.name
""")

results = cursor.fetchall()

total_apts = 0
total_owners = 0
total_tenants = 0
total_with_tenants = 0

for block_name, apts, apts_with_owners, apts_with_tenants, owners, tenants in results:
    print(f"\n{block_name}:")
    print(f"  Toplam Daire: {apts}")
    print(f"  Malik Sayısı: {owners} (Her dairede 1 malik)")
    print(f"  Kiracı Sayısı: {tenants}")
    print(f"  Sadece Malik Olan: {apts - apts_with_tenants} daire")
    print(f"  Malik + Kiracı Olan: {apts_with_tenants} daire")
    
    total_apts += apts
    total_owners += owners
    total_tenants += tenants
    total_with_tenants += apts_with_tenants

print("\n" + "=" * 80)
print("GENEL TOPLAM")
print("=" * 80)
print(f"Toplam Daire: {total_apts}")
print(f"Toplam Malik: {total_owners} (Her dairede 1 malik ✓)")
print(f"Toplam Kiracı: {total_tenants}")
print(f"Sadece Malik Olan Daire: {total_apts - total_with_tenants}")
print(f"Malik + Kiracı Olan Daire: {total_with_tenants}")
print("=" * 80)

# Sample some apartments to show the structure
print("\nÖRNEK DAİRELER (İlk 5 daire):")
print("-" * 80)

cursor.execute("""
    SELECT 
        b.name as block_name,
        a.unit_number,
        GROUP_CONCAT(
            CONCAT(u.full_name, ' (', IF(rh.is_owner, 'Malik', 'Kiracı'), ')')
            ORDER BY rh.is_owner DESC
            SEPARATOR ', '
        ) as residents
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    LEFT JOIN residency_history rh ON a.id = rh.apartment_id AND rh.move_out_date IS NULL
    LEFT JOIN users u ON rh.user_id = u.id
    WHERE b.site_id = '1' AND a.is_deleted = FALSE
    GROUP BY a.id, b.name, a.unit_number
    ORDER BY b.name, a.unit_number
    LIMIT 5
""")

examples = cursor.fetchall()

for block_name, unit_number, residents in examples:
    print(f"{block_name} - Daire {unit_number}: {residents}")

print("=" * 80)

cursor.close()
conn.close()
