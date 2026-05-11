#!/usr/bin/env python3

import mysql.connector
from mysql.connector import Error

def debug_dashboard_dues_fixed():
    """Debug the dashboard dues calculation logic with correct column names"""
    
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
            
            print("🔍 Debugging Dashboard Dues Calculation (Fixed)")
            print("=" * 60)
            
            # 1. Check apartments for site 1 using blocks JOIN
            print("\n1. Checking apartments for site 1 via blocks:")
            cursor.execute("""
                SELECT a.id, a.unit_number, a.site_id as direct_site_id, b.site_id as block_site_id, b.name as block_name
                FROM apartments a
                LEFT JOIN blocks b ON a.block_id = b.id
                WHERE b.site_id = '1'
                LIMIT 10
            """)
            apartments = cursor.fetchall()
            
            if apartments:
                print(f"   Found {len(apartments)} apartments for site 1 via blocks:")
                for apt in apartments[:5]:  # Show first 5
                    print(f"   - Unit {apt['unit_number']}: ID={apt['id']}, Block={apt['block_name']}, Direct Site ID={apt['direct_site_id']}")
                
                apartment_ids = [apt['id'] for apt in apartments]
                
                # 2. Check dues for these apartments
                print(f"\n2. Checking dues for site 1 apartments:")
                placeholders = ', '.join(['%s'] * len(apartment_ids))
                cursor.execute(f"""
                    SELECT d.id, d.apartment_id, d.status, d.total_amount, a.unit_number, b.name as block_name
                    FROM dues d
                    LEFT JOIN apartments a ON d.apartment_id = a.id
                    LEFT JOIN blocks b ON a.block_id = b.id
                    WHERE d.apartment_id IN ({placeholders})
                    ORDER BY d.status, d.total_amount DESC
                    LIMIT 20
                """, apartment_ids)
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
                        print(f"   - {due['block_name']} Unit {due['unit_number']}: {due['status']} - ₺{due['total_amount']:,}")
                        
                else:
                    print("   ❌ No dues found for site 1 apartments!")
                    
            else:
                print("   ❌ No apartments found for site 1 via blocks!")
                
            # 3. Check total dues count for verification
            print(f"\n3. Total dues in database:")
            cursor.execute("SELECT COUNT(*) as total FROM dues")
            total_dues = cursor.fetchone()
            print(f"   Total dues: {total_dues['total']}")
            
            cursor.execute("SELECT status, COUNT(*) as count FROM dues GROUP BY status")
            status_breakdown = cursor.fetchall()
            print(f"   Status breakdown:")
            for status in status_breakdown:
                print(f"   - {status['status']}: {status['count']}")
                
            # 4. Check if apartmentRepository.findBySiteId would work
            print(f"\n4. Testing apartmentRepository.findBySiteId('1') logic:")
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM apartments a
                LEFT JOIN blocks b ON a.block_id = b.id
                WHERE b.site_id = '1'
            """)
            repo_count = cursor.fetchone()
            print(f"   Repository would return {repo_count['count']} apartments")
            
            # 5. Check the exact logic from DashboardService
            print(f"\n5. Simulating DashboardService.calculateDueStatsBySite logic:")
            
            # Get apartment IDs for site 1
            cursor.execute("""
                SELECT a.id
                FROM apartments a
                LEFT JOIN blocks b ON a.block_id = b.id
                WHERE b.site_id = '1'
            """)
            site_apartment_ids = [row['id'] for row in cursor.fetchall()]
            
            if site_apartment_ids:
                print(f"   Site 1 has {len(site_apartment_ids)} apartments")
                
                # Count total dues
                placeholders = ', '.join(['%s'] * len(site_apartment_ids))
                cursor.execute(f"""
                    SELECT COUNT(*) as total_dues
                    FROM dues
                    WHERE apartment_id IN ({placeholders})
                """, site_apartment_ids)
                total_dues = cursor.fetchone()['total_dues']
                
                # Count paid dues (status = 'odendi')
                cursor.execute(f"""
                    SELECT COUNT(*) as paid_dues
                    FROM dues
                    WHERE apartment_id IN ({placeholders}) AND status = 'odendi'
                """, site_apartment_ids)
                paid_dues = cursor.fetchone()['paid_dues']
                
                # Count unpaid dues (status IN ('bekliyor', 'gecikmis', 'kismi_odendi'))
                cursor.execute(f"""
                    SELECT COUNT(*) as unpaid_dues, SUM(total_amount) as unpaid_amount
                    FROM dues
                    WHERE apartment_id IN ({placeholders}) 
                    AND status IN ('bekliyor', 'gecikmis', 'kismi_odendi')
                """, site_apartment_ids)
                unpaid_result = cursor.fetchone()
                unpaid_dues = unpaid_result['unpaid_dues']
                unpaid_amount = float(unpaid_result['unpaid_amount'] or 0)
                
                print(f"   Dashboard calculation results:")
                print(f"   - Total dues: {total_dues}")
                print(f"   - Paid dues: {paid_dues}")
                print(f"   - Unpaid dues: {unpaid_dues}")
                print(f"   - Unpaid amount: ₺{unpaid_amount:,.2f}")
                
                if unpaid_dues > 0:
                    print(f"   ✅ SUCCESS: Should show {unpaid_dues} pending dues worth ₺{unpaid_amount:,.2f}")
                else:
                    print(f"   ❌ ISSUE: Would still show 0 pending dues")
            else:
                print(f"   ❌ No apartments found for site 1")
                
    except Error as e:
        print(f"❌ Database error: {e}")
        
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    debug_dashboard_dues_fixed()