import mysql.connector
import random

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hilton5252.',
    database='smart_site_management'
)
cursor = conn.cursor(dictionary=True)

print("=" * 80)
print("FIXING TENANT DISTRIBUTION")
print("=" * 80)

# Get all apartments for Site 1
cursor.execute("""
    SELECT 
        id,
        unit_number,
        block_id,
        owner_user_id,
        current_resident_id
    FROM apartments 
    WHERE site_id = '1' AND (is_deleted = 0 OR is_deleted IS NULL)
    ORDER BY block_id, unit_number
""")
apartments = cursor.fetchall()

print(f"\nTotal apartments: {len(apartments)}")

# We want approximately 30% to have tenants (different from owner)
# 70% should be owner-occupied (current_resident_id = owner_user_id or NULL)
target_tenant_percentage = 0.30
target_tenant_count = int(len(apartments) * target_tenant_percentage)

print(f"Target: ~{target_tenant_count} apartments with tenants ({target_tenant_percentage*100}%)")
print(f"Target: ~{len(apartments) - target_tenant_count} owner-occupied apartments")

# Randomly select apartments to have tenants
apartments_with_tenants = random.sample(apartments, target_tenant_count)
tenant_ids = set(apt['id'] for apt in apartments_with_tenants)

updated_count = 0
owner_occupied_count = 0
tenant_occupied_count = 0

for apt in apartments:
    if apt['id'] in tenant_ids:
        # Keep tenant (current_resident_id stays different from owner)
        # Already has different tenant, no change needed
        if apt['current_resident_id'] != apt['owner_user_id']:
            tenant_occupied_count += 1
        else:
            # This apartment was selected for tenant but currently owner-occupied
            # Keep it as is (we already have enough tenants from previous script)
            cursor.execute("""
                UPDATE apartments 
                SET current_resident_id = owner_user_id
                WHERE id = %s
            """, (apt['id'],))
            owner_occupied_count += 1
            updated_count += 1
    else:
        # Make it owner-occupied (current_resident_id = owner_user_id)
        if apt['current_resident_id'] != apt['owner_user_id']:
            cursor.execute("""
                UPDATE apartments 
                SET current_resident_id = owner_user_id
                WHERE id = %s
            """, (apt['id'],))
            owner_occupied_count += 1
            updated_count += 1
        else:
            owner_occupied_count += 1

conn.commit()

print(f"\n{'=' * 60}")
print(f"RESULTS:")
print(f"{'=' * 60}")
print(f"Updated apartments: {updated_count}")
print(f"Owner-occupied: {owner_occupied_count}")
print(f"Tenant-occupied: {tenant_occupied_count}")

# Verify final distribution
cursor.execute("""
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN owner_user_id IS NOT NULL THEN 1 ELSE 0 END) as with_owner,
        SUM(CASE WHEN current_resident_id IS NOT NULL 
                 AND current_resident_id != owner_user_id THEN 1 ELSE 0 END) as with_tenant,
        SUM(CASE WHEN current_resident_id = owner_user_id THEN 1 ELSE 0 END) as owner_occupied
    FROM apartments 
    WHERE site_id = '1' AND (is_deleted = 0 OR is_deleted IS NULL)
""")
stats = cursor.fetchone()

print(f"\nFINAL STATISTICS:")
print(f"  Total apartments: {stats['total']}")
print(f"  With owner: {stats['with_owner']}")
print(f"  With tenant (different from owner): {stats['with_tenant']}")
print(f"  Owner-occupied: {stats['owner_occupied']}")
print(f"  Tenant percentage: {(stats['with_tenant'] / stats['total'] * 100):.1f}%")

print("\n" + "=" * 80)
print("COMPLETE")
print("=" * 80)

cursor.close()
conn.close()
