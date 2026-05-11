#!/usr/bin/env python3

import mysql.connector
import random

def fix_apartment_occupancy_site1():
    """Fix apartment occupancy in site 1 to have proper distribution"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        print("🔧 Starting apartment occupancy fix for site 1...")
        
        # Get all apartments in site 1 with their current occupancy
        cursor.execute("""
            SELECT a.id, a.unit_number, b.name as block_name, 
                   a.owner_user_id, a.current_resident_id,
                   u1.full_name as owner_name, u2.full_name as tenant_name
            FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            LEFT JOIN users u1 ON a.owner_user_id = u1.id
            LEFT JOIN users u2 ON a.current_resident_id = u2.id
            WHERE b.site_id = '1' 
            ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
        """)
        apartments = cursor.fetchall()
        
        print(f"📊 Found {len(apartments)} apartments in site 1")
        
        # Group apartments by block
        blocks = {}
        for apt in apartments:
            block_name = apt[2]
            if block_name not in blocks:
                blocks[block_name] = []
            blocks[block_name].append(apt)
        
        print(f"📊 Found {len(blocks)} blocks: {list(blocks.keys())}")
        
        # Process each block
        for block_name, block_apartments in blocks.items():
            print(f"\n🏢 Processing {block_name}...")
            print(f"   Apartments in block: {len(block_apartments)}")
            
            # Separate apartments that have both owner and tenant
            both_occupied = []
            single_occupied = []
            
            for apt in block_apartments:
                apt_id, unit_number, _, owner_id, tenant_id, owner_name, tenant_name = apt
                if owner_id and tenant_id:
                    both_occupied.append(apt)
                else:
                    single_occupied.append(apt)
            
            print(f"   Apartments with both owner+tenant: {len(both_occupied)}")
            print(f"   Apartments with single occupant: {len(single_occupied)}")
            
            # For apartments with both owner and tenant, randomly choose one to keep
            # Target: 34 owners + 20 tenants = 54 total per block
            target_owners = min(34, len(both_occupied))
            target_tenants = min(20, len(both_occupied) - target_owners)
            
            print(f"   Target: {target_owners} owners, {target_tenants} tenants")
            
            # Randomly shuffle the apartments
            random.shuffle(both_occupied)
            
            # First 34 apartments will keep only the owner
            for i in range(target_owners):
                apt = both_occupied[i]
                apt_id, unit_number, _, owner_id, tenant_id, owner_name, tenant_name = apt
                
                if tenant_id:
                    print(f"   🔄 {block_name} {unit_number}: Removing tenant {tenant_name}, keeping owner {owner_name}")
                    cursor.execute("""
                        UPDATE apartments 
                        SET current_resident_id = NULL 
                        WHERE id = %s
                    """, (apt_id,))
            
            # Next 20 apartments will keep only the tenant
            for i in range(target_owners, target_owners + target_tenants):
                if i < len(both_occupied):
                    apt = both_occupied[i]
                    apt_id, unit_number, _, owner_id, tenant_id, owner_name, tenant_name = apt
                    
                    if owner_id:
                        print(f"   🔄 {block_name} {unit_number}: Removing owner {owner_name}, keeping tenant {tenant_name}")
                        cursor.execute("""
                            UPDATE apartments 
                            SET owner_user_id = NULL 
                            WHERE id = %s
                        """, (apt_id,))
            
            # Remaining apartments will be emptied
            for i in range(target_owners + target_tenants, len(both_occupied)):
                apt = both_occupied[i]
                apt_id, unit_number, _, owner_id, tenant_id, owner_name, tenant_name = apt
                
                print(f"   🔄 {block_name} {unit_number}: Emptying apartment (removing both {owner_name} and {tenant_name})")
                cursor.execute("""
                    UPDATE apartments 
                    SET owner_user_id = NULL, current_resident_id = NULL, status = 'bos'
                    WHERE id = %s
                """, (apt_id,))
        
        # Commit changes
        connection.commit()
        print(f"\n✅ Apartment occupancy fix completed!")
        
        # Verify the results
        print(f"\n📊 Verification:")
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NOT NULL 
            AND a.current_resident_id IS NULL
        """)
        only_owner = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NULL 
            AND a.current_resident_id IS NOT NULL
        """)
        only_tenant = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NULL 
            AND a.current_resident_id IS NULL
        """)
        empty_apartments = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NOT NULL 
            AND a.current_resident_id IS NOT NULL
        """)
        both_occupied = cursor.fetchone()[0]
        
        print(f"   Owner-only apartments: {only_owner}")
        print(f"   Tenant-only apartments: {only_tenant}")
        print(f"   Empty apartments: {empty_apartments}")
        print(f"   Both owner+tenant: {both_occupied}")
        print(f"   Total occupied: {only_owner + only_tenant}")
        
        return True
        
    except mysql.connector.Error as error:
        print(f"❌ Database error: {error}")
        if 'connection' in locals():
            connection.rollback()
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        if 'connection' in locals():
            connection.rollback()
        return False
    finally:
        try:
            if 'connection' in locals() and connection.is_connected():
                cursor.close()
                connection.close()
                print("🔌 Database connection closed")
        except:
            pass

if __name__ == "__main__":
    fix_apartment_occupancy_site1()