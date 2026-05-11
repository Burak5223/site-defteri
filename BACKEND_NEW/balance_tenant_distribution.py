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
print("BALANCING TENANT DISTRIBUTION")
print("=" * 80)

# Target: 30% of apartments should have tenants
target_percentage = 0.30

# Get current distribution by block
cursor.execute("""
    SELECT 
        b.id as block_id,
        b.name as block_name,
        COUNT(a.id) as total_apartments,
        SUM(CASE WHEN a.current_resident_id IS NOT NULL 
                 AND a.current_resident_id != a.owner_user_id THEN 1 ELSE 0 END) as current_tenants
    FROM blocks b
    LEFT JOIN apartments a ON a.block_id = b.id 
        AND a.site_id = '1' 
        AND (a.is_deleted = 0 OR a.is_deleted IS NULL)
    WHERE b.site_id = '1' AND (b.is_deleted = 0 OR b.is_deleted IS NULL)
    GROUP BY b.id, b.name
    ORDER BY b.name
""")
blocks = cursor.fetchall()

print("\nCURRENT DISTRIBUTION:")
for block in blocks:
    target_for_block = int(block['total_apartments'] * target_percentage)
    print(f"{block['block_name']}: {block['current_tenants']}/{block['total_apartments']} tenants (target: ~{target_for_block})")

print("\n" + "=" * 60)

for block in blocks:
    target_tenants = int(block['total_apartments'] * target_percentage)
    current_tenants = block['current_tenants']
    
    if current_tenants < target_tenants:
        # Need to add more tenants
        needed = target_tenants - current_tenants
        print(f"\n{block['block_name']}: Adding {needed} more tenants...")
        
        # Get owner-occupied apartments in this block
        cursor.execute("""
            SELECT id, unit_number, owner_user_id, current_resident_id
            FROM apartments
            WHERE block_id = %s 
                AND site_id = '1'
                AND (is_deleted = 0 OR is_deleted IS NULL)
                AND (current_resident_id = owner_user_id OR current_resident_id IS NULL)
                AND owner_user_id IS NOT NULL
            ORDER BY RAND()
            LIMIT %s
        """, (block['block_id'], needed))
        
        apartments_to_update = cursor.fetchall()
        
        # Get available users to be tenants (different from owners)
        cursor.execute("""
            SELECT id FROM users 
            WHERE site_id = '1' 
                AND user_role = 'RESIDENT'
                AND (is_deleted = 0 OR is_deleted IS NULL)
            ORDER BY RAND()
        """)
        available_tenants = cursor.fetchall()
        
        for i, apt in enumerate(apartments_to_update):
            if i < len(available_tenants):
                # Find a tenant that's different from the owner
                tenant = None
                for t in available_tenants:
                    if t['id'] != apt['owner_user_id']:
                        tenant = t
                        break
                
                if tenant:
                    cursor.execute("""
                        UPDATE apartments 
                        SET current_resident_id = %s
                        WHERE id = %s
                    """, (tenant['id'], apt['id']))
                    print(f"  Daire {apt['unit_number']}: Added tenant")
        
        conn.commit()
    
    elif current_tenants > target_tenants:
        # Need to remove some tenants
        excess = current_tenants - target_tenants
        print(f"\n{block['block_name']}: Removing {excess} tenants...")
        
        # Get tenant-occupied apartments in this block
        cursor.execute("""
            SELECT id, unit_number, owner_user_id, current_resident_id
            FROM apartments
            WHERE block_id = %s 
                AND site_id = '1'
                AND (is_deleted = 0 OR is_deleted IS NULL)
                AND current_resident_id IS NOT NULL
                AND current_resident_id != owner_user_id
            ORDER BY RAND()
            LIMIT %s
        """, (block['block_id'], excess))
        
        apartments_to_update = cursor.fetchall()
        
        for apt in apartments_to_update:
            # Make it owner-occupied
            cursor.execute("""
                UPDATE apartments 
                SET current_resident_id = owner_user_id
                WHERE id = %s
            """, (apt['id'],))
            print(f"  Daire {apt['unit_number']}: Removed tenant (now owner-occupied)")
        
        conn.commit()

# Final verification
print("\n" + "=" * 80)
print("FINAL DISTRIBUTION:")
print("=" * 80)

cursor.execute("""
    SELECT 
        b.id as block_id,
        b.name as block_name,
        COUNT(a.id) as total_apartments,
        SUM(CASE WHEN a.owner_user_id IS NOT NULL THEN 1 ELSE 0 END) as owners,
        SUM(CASE WHEN a.current_resident_id IS NOT NULL 
                 AND a.current_resident_id != a.owner_user_id THEN 1 ELSE 0 END) as tenants,
        SUM(CASE WHEN a.current_resident_id = a.owner_user_id THEN 1 ELSE 0 END) as owner_occupied
    FROM blocks b
    LEFT JOIN apartments a ON a.block_id = b.id 
        AND a.site_id = '1' 
        AND (a.is_deleted = 0 OR a.is_deleted IS NULL)
    WHERE b.site_id = '1' AND (b.is_deleted = 0 OR b.is_deleted IS NULL)
    GROUP BY b.id, b.name
    ORDER BY b.name
""")
final_blocks = cursor.fetchall()

total_apartments = 0
total_owners = 0
total_tenants = 0
total_residents = 0

for block in final_blocks:
    total_apartments += block['total_apartments']
    total_owners += block['owners']
    total_tenants += block['tenants']
    total_residents += block['owners'] + block['tenants']
    
    print(f"\n{block['block_name']}:")
    print(f"  Apartments: {block['total_apartments']}")
    print(f"  Owners: {block['owners']}")
    print(f"  Tenants: {block['tenants']} ({block['tenants']/block['total_apartments']*100:.1f}%)")
    print(f"  Owner-occupied: {block['owner_occupied']}")
    print(f"  Total Residents: {block['owners'] + block['tenants']}")

print(f"\n{'=' * 60}")
print("SITE TOTALS:")
print(f"{'=' * 60}")
print(f"Total Apartments: {total_apartments}")
print(f"Total Owners: {total_owners}")
print(f"Total Tenants: {total_tenants} ({total_tenants/total_apartments*100:.1f}%)")
print(f"Total Residents: {total_residents}")
print("=" * 80)

cursor.close()
conn.close()
