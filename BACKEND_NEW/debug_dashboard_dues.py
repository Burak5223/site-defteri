#!/usr/bin/env python3

import mysql.connector
from mysql.connector import Error

def debug_dashboard_dues():
    """Debug the dashboard dues calculation logic"""
    
    connection = None
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("🔍 Debugging Dashboard Dues Calculation")
            print("=" * 50)
            
            # 1. Check apartments for site 1
            print("\n1. Checking apartments for site 1:")
            cursor.execute("""
                SELECT a.id, a.apartment_number, a.site_id, b.site_id as block_site_id, b.name as block_name
                FROM apartments a
                LEFT JOIN blocks b ON a.block_id = b.id
                WHERE b.site_id = 1
                LIMIT 10
            """)
            apartments = cursor.fetchall()
            
            if apartments:
                print(f"   Found {len(apartments)} apartments for site 1:")
                for apt in apartments[:5]:  # Show first 5
                    print(f"   - Apartment {apt['apartment_number']}: ID={apt['id']}, Block={apt['block_name']}")
                
                apartment_ids = [apt['id'] for apt in apartments]
                apartment_ids_str = "', '".join(apartment_ids)
                
                # 2. Check dues for these apartments
                print(f"\n2. Checking dues for site 1 apartments:")
                cursor.execute(f"""
                    SELECT d.id, d.apartment_id, d.status, d.total_amount, a.apartment_number
                    FROM dues d
                    LEFT JOIN apartments a ON d.apartment_id = a.id
                    WHERE d.apartment_id IN ('{apartment_ids_str}')
                    ORDER BY d.status, d.total_amount DESC
                    LIMIT 20
                """)
                dues = cursor.fetchall()
                
                if dues:
                    print(f"   Found {len(dues)} dues for site 1 apartments:")
                    
                    # Group by status
                    status_counts = {}
                    status_amounts = {}
                    
                    for due in dues:
                        status = due['status']
                        if status not in status_counts:
                            status_counts[status] = 0
                            status_amounts[status] = 0
                        status_counts[status] += 1
                        status_amounts[status] += float(due['total_amount'] or 0)
                    
                    print(f"   Status breakdown:")
                    for status, count in status_counts.items():
                        amount = status_amounts[status]
                        print(f"   - {status}: {count} dues, ₺{amount:,.2f}")
                    
                    # Show some examples
                    print(f"\n   Sample dues:")
                    for due in dues[:5]:
                        print(f"   - Apt {due['apartment_number']}: {due['status']} - ₺{due['total_amount']:,}")
                        
                else:
                    print("   ❌ No dues found for site 1 apartments!")
                    
            else:
                print("   ❌ No apartments found for site 1!")
                
            # 3. Check the apartmentRepository.findBySiteId method simulation
            print(f"\n3. Simulating apartmentRepository.findBySiteId('1'):")
            cursor.execute("""
                SELECT a.id, a.apartment_number, a.site_id, b.site_id as block_site_id
                FROM apartments a
                LEFT JOIN blocks b ON a.block_id = b.id
                WHERE b.site_id = '1'
            """)
            repo_apartments = cursor.fetchall()
            
            print(f"   Repository would return {len(repo_apartments)} apartments")
            if repo_apartments:
                repo_apartment_ids = [apt['id'] for apt in repo_apartments]
                print(f"   Apartment IDs: {repo_apartment_ids[:10]}...")  # Show first 10
                
                # Check dues for these IDs
                repo_ids_str = "', '".join(repo_apartment_ids)
                cursor.execute(f"""
                    SELECT status, COUNT(*) as count, SUM(total_amount) as total
                    FROM dues
                    WHERE apartment_id IN ('{repo_ids_str}')
                    GROUP BY status
                """)
                repo_dues = cursor.fetchall()
                
                print(f"   Dues for repository apartments:")
                for due in repo_dues:
                    print(f"   - {due['status']}: {due['count']} dues, ₺{due['total']:,}")
                    
            # 4. Check if there's a mismatch in site_id types
            print(f"\n4. Checking site_id type consistency:")
            cursor.execute("SELECT DISTINCT site_id, typeof(site_id) FROM blocks WHERE site_id IS NOT NULL")
            site_ids = cursor.fetchall()
            print(f"   Block site_ids: {site_ids}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    debug_dashboard_dues()