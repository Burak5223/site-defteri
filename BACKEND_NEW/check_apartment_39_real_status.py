#!/usr/bin/env python3

import mysql.connector

def check_apartment_39_real_status():
    """Check the real status of apartment 39 in site 1"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        cursor = connection.cursor()
        
        # Find apartment 39 in site 1 (through blocks)
        print("🏠 Checking apartment 39 in site 1...")
        cursor.execute("""
            SELECT a.id, a.unit_number, b.name as block_name, 
                   a.owner_user_id, a.current_resident_id, a.status,
                   b.site_id
            FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE a.unit_number = '39' 
            AND b.site_id = '1'
        """)
        apt_39_site1 = cursor.fetchall()
        
        print(f"📋 Apartment 39 in site 1:")
        for apt in apt_39_site1:
            print(f"   ID: {apt[0]}")
            print(f"   Unit: {apt[1]}")
            print(f"   Block: {apt[2]}")
            print(f"   Owner: {apt[3]}")
            print(f"   Current Resident: {apt[4]}")
            print(f"   Status: {apt[5]}")
            print(f"   Site ID: {apt[6]}")
            
            # Check if there are users assigned
            if apt[3]:
                cursor.execute("SELECT full_name, email FROM users WHERE id = %s", (apt[3],))
                owner = cursor.fetchone()
                if owner:
                    print(f"   Owner Name: {owner[0]} ({owner[1]})")
            
            if apt[4]:
                cursor.execute("SELECT full_name, email FROM users WHERE id = %s", (apt[4],))
                tenant = cursor.fetchone()
                if tenant:
                    print(f"   Tenant Name: {tenant[0]} ({tenant[1]})")
            
            print("   ---")
        
        # Clear the apartment 39 in site 1 if it has residents
        if apt_39_site1:
            apt_id = apt_39_site1[0][0]
            current_resident = apt_39_site1[0][4]
            
            if current_resident:
                print(f"\n🧹 Clearing current resident from apartment 39...")
                cursor.execute("UPDATE apartments SET current_resident_id = NULL WHERE id = %s", (apt_id,))
                connection.commit()
                print("✅ Current resident cleared")
            else:
                print("✅ Apartment 39 is already available for tenant")
        
        return apt_39_site1
        
    except mysql.connector.Error as error:
        print(f"❌ Database error: {error}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        try:
            if 'connection' in locals() and connection.is_connected():
                cursor.close()
                connection.close()
                print("🔌 Database connection closed")
        except:
            pass

if __name__ == "__main__":
    check_apartment_39_real_status()