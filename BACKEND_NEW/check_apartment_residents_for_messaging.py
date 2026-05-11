import mysql.connector
from mysql.connector import Error

def check_apartment_residents():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("\n=== DAİRELER VE SAKİNLERİ ===\n")
            
            # Daireleri ve sakinlerini kontrol et
            query = """
            SELECT 
                a.id as apartment_id,
                a.unit_number,
                a.block_name,
                a.site_id,
                a.owner_user_id,
                a.current_resident_id,
                owner.full_name as owner_name,
                owner.email as owner_email,
                tenant.full_name as tenant_name,
                tenant.email as tenant_email,
                usm_owner.id as owner_membership_id,
                usm_tenant.id as tenant_membership_id
            FROM apartments a
            LEFT JOIN users owner ON a.owner_user_id = owner.id
            LEFT JOIN users tenant ON a.current_resident_id = tenant.id
            LEFT JOIN user_site_memberships usm_owner ON owner.id = usm_owner.user_id AND a.site_id = usm_owner.site_id
            LEFT JOIN user_site_memberships usm_tenant ON tenant.id = usm_tenant.user_id AND a.site_id = usm_tenant.site_id
            WHERE a.site_id = '1'
            ORDER BY a.block_name, CAST(a.unit_number AS UNSIGNED)
            LIMIT 20
            """
            
            cursor.execute(query)
            apartments = cursor.fetchall()
            
            for apt in apartments:
                print(f"Daire: {apt['block_name']} - {apt['unit_number']}")
                print(f"  Apartment ID: {apt['apartment_id']}")
                
                if apt['owner_user_id']:
                    print(f"  Malik: {apt['owner_name']} ({apt['owner_email']})")
                    print(f"    - User ID: {apt['owner_user_id']}")
                    print(f"    - Membership: {'✓' if apt['owner_membership_id'] else '✗'}")
                else:
                    print(f"  Malik: YOK")
                
                if apt['current_resident_id']:
                    print(f"  Kiracı: {apt['tenant_name']} ({apt['tenant_email']})")
                    print(f"    - User ID: {apt['current_resident_id']}")
                    print(f"    - Membership: {'✓' if apt['tenant_membership_id'] else '✗'}")
                else:
                    print(f"  Kiracı: YOK")
                
                print()
            
            print(f"\nToplam {len(apartments)} daire kontrol edildi.")
            
            cursor.close()
            connection.close()
            
    except Error as e:
        print(f"Hata: {e}")

if __name__ == "__main__":
    check_apartment_residents()
