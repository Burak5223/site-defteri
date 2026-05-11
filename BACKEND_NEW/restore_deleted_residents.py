#!/usr/bin/env python3

import mysql.connector
import random

def restore_deleted_residents():
    """Restore deleted residents back to apartments"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        print("🔄 Restoring deleted residents to apartments...")
        
        # Get all apartments that currently have only owner (no tenant)
        cursor.execute("""
            SELECT a.id, a.unit_number, b.name as block_name, 
                   a.owner_user_id, u.full_name as owner_name
            FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            LEFT JOIN users u ON a.owner_user_id = u.id
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NOT NULL 
            AND a.current_resident_id IS NULL
            ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
        """)
        owner_only_apartments = cursor.fetchall()
        
        print(f"📊 Found {len(owner_only_apartments)} apartments with only owner")
        
        # Get all apartments that currently have only tenant (no owner)
        cursor.execute("""
            SELECT a.id, a.unit_number, b.name as block_name, 
                   a.current_resident_id, u.full_name as tenant_name
            FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            LEFT JOIN users u ON a.current_resident_id = u.id
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NULL 
            AND a.current_resident_id IS NOT NULL
            ORDER BY b.name, CAST(a.unit_number AS UNSIGNED)
        """)
        tenant_only_apartments = cursor.fetchall()
        
        print(f"📊 Found {len(tenant_only_apartments)} apartments with only tenant")
        
        # Get all users who are not currently assigned to any apartment
        cursor.execute("""
            SELECT u.id, u.full_name, u.email
            FROM users u
            JOIN user_site_memberships usm ON u.id = usm.user_id
            WHERE usm.site_id = '1' 
            AND usm.role_type = 'RESIDENT'
            AND u.id NOT IN (
                SELECT DISTINCT owner_user_id FROM apartments a 
                JOIN blocks b ON a.block_id = b.id 
                WHERE b.site_id = '1' AND owner_user_id IS NOT NULL
                UNION
                SELECT DISTINCT current_resident_id FROM apartments a 
                JOIN blocks b ON a.block_id = b.id 
                WHERE b.site_id = '1' AND current_resident_id IS NOT NULL
            )
            AND u.status = 'aktif'
        """)
        unassigned_users = cursor.fetchall()
        
        print(f"📊 Found {len(unassigned_users)} unassigned resident users")
        
        if len(unassigned_users) == 0:
            print("✅ No unassigned users found - all residents are already assigned to apartments")
            return True
        
        # Show some examples of unassigned users
        print(f"\n🔍 Examples of unassigned users:")
        for i, user in enumerate(unassigned_users[:10]):
            print(f"   {user[1]} ({user[2]})")
        
        # Strategy: Add tenants to owner-only apartments
        restored_count = 0
        
        # Shuffle both lists for random assignment
        random.shuffle(owner_only_apartments)
        random.shuffle(unassigned_users)
        
        # Add tenants to owner-only apartments
        for i, user in enumerate(unassigned_users):
            if i < len(owner_only_apartments):
                apartment = owner_only_apartments[i]
                apt_id, unit_number, block_name, owner_id, owner_name = apartment
                user_id, user_name, user_email = user
                
                print(f"   🏠 Adding {user_name} as tenant to {block_name} {unit_number} (owner: {owner_name})")
                
                cursor.execute("""
                    UPDATE apartments 
                    SET current_resident_id = %s 
                    WHERE id = %s
                """, (user_id, apt_id))
                
                # Also create residency history record
                cursor.execute("""
                    INSERT INTO residency_history (id, user_id, apartment_id, move_in_date, is_owner, status, is_deleted)
                    VALUES (UUID(), %s, %s, NOW(), FALSE, 'active', FALSE)
                    ON DUPLICATE KEY UPDATE 
                    status = 'active', is_deleted = FALSE, move_in_date = NOW()
                """, (user_id, apt_id))
                
                restored_count += 1
            else:
                # If we have more users than owner-only apartments, 
                # we could add them as owners to tenant-only apartments
                remaining_index = i - len(owner_only_apartments)
                if remaining_index < len(tenant_only_apartments):
                    apartment = tenant_only_apartments[remaining_index]
                    apt_id, unit_number, block_name, tenant_id, tenant_name = apartment
                    user_id, user_name, user_email = user
                    
                    print(f"   🏠 Adding {user_name} as owner to {block_name} {unit_number} (tenant: {tenant_name})")
                    
                    cursor.execute("""
                        UPDATE apartments 
                        SET owner_user_id = %s 
                        WHERE id = %s
                    """, (user_id, apt_id))
                    
                    # Also create residency history record
                    cursor.execute("""
                        INSERT INTO residency_history (id, user_id, apartment_id, move_in_date, is_owner, status, is_deleted)
                        VALUES (UUID(), %s, %s, NOW(), TRUE, 'active', FALSE)
                        ON DUPLICATE KEY UPDATE 
                        status = 'active', is_deleted = FALSE, move_in_date = NOW()
                    """, (user_id, apt_id))
                    
                    restored_count += 1
        
        # Commit changes
        connection.commit()
        print(f"\n✅ Restored {restored_count} residents to apartments!")
        
        # Verify the results
        print(f"\n📊 Final verification:")
        cursor.execute("""
            SELECT COUNT(*) FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.site_id = '1' 
            AND a.owner_user_id IS NOT NULL 
            AND a.current_resident_id IS NOT NULL
        """)
        both_occupied = cursor.fetchone()[0]
        
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
        
        print(f"   Apartments with both owner+tenant: {both_occupied}")
        print(f"   Apartments with only owner: {only_owner}")
        print(f"   Apartments with only tenant: {only_tenant}")
        print(f"   Total residents: {both_occupied * 2 + only_owner + only_tenant}")
        
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
    restore_deleted_residents()