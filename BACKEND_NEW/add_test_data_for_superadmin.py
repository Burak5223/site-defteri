#!/usr/bin/env python3
"""
Add test data for super admin dashboard:
1. Add residents (sakin) to all sites
2. Add payments with 2% commission
"""
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import random
import uuid

def add_test_data():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("=== Adding Test Data for Super Admin ===\n")
            
            # Get all sites
            cursor.execute("SELECT id, name FROM sites")
            sites = cursor.fetchall()
            
            print(f"Found {len(sites)} sites\n")
            
            total_residents = 0
            total_payments = 0
            total_commission = 0.0
            
            # Turkish names
            first_names = ["Ahmet", "Mehmet", "Ayşe", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif"]
            last_names = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk"]
            
            for site in sites:
                site_id = site['id']
                site_name = site['name']
                
                print(f"{site_name}:")
                
                # Get apartments for this site
                cursor.execute("""
                    SELECT id FROM apartments 
                    WHERE site_id = %s AND is_deleted = 0
                    LIMIT 15
                """, (site_id,))
                apartments = cursor.fetchall()
                
                if not apartments:
                    print("  No apartments found, skipping\n")
                    continue
                
                # Add 10-15 residents per site
                residents_count = min(random.randint(10, 15), len(apartments))
                site_residents = []
                
                for i in range(residents_count):
                    apt = apartments[i]
                    
                    # Create user
                    user_id = str(uuid.uuid4())
                    first_name = random.choice(first_names)
                    last_name = random.choice(last_names)
                    full_name = f"{first_name} {last_name}"
                    email = f"{first_name.lower()}.{last_name.lower()}{i}@{site_name.lower().replace(' ', '')}.com"
                    phone = f"05{random.randint(300000000, 599999999)}"
                    
                    # Insert user
                    cursor.execute("""
                        INSERT INTO users (id, email, password_hash, full_name, phone, status, is_deleted, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        user_id,
                        email,
                        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKZblo6QLG',  # admin123
                        full_name,
                        phone,
                        'aktif',
                        False,
                        datetime.now()
                    ))
                    
                    # Add user_site_membership as sakin
                    membership_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO user_site_memberships (id, user_id, site_id, role_type, status, is_deleted, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        membership_id,
                        user_id,
                        site_id,
                        'sakin',
                        'aktif',
                        False,
                        datetime.now()
                    ))
                    
                    site_residents.append({
                        'user_id': user_id,
                        'apartment_id': apt['id']
                    })
                    total_residents += 1
                
                print(f"  ✓ Added {residents_count} residents")
                
                # Add payments with commission for last 6 months
                payments_count = random.randint(30, 50)
                
                for _ in range(payments_count):
                    if not site_residents:
                        break
                    
                    resident = random.choice(site_residents)
                    payment_id = str(uuid.uuid4())
                    
                    # Random amount
                    amount = random.choice([500, 750, 1000, 1250, 1500, 2000, 2500, 3000])
                    commission = round(amount * 0.02, 2)  # 2% commission
                    
                    # Random date in last 6 months
                    days_ago = random.randint(0, 180)
                    payment_date = datetime.now() - timedelta(days=days_ago)
                    
                    # Insert payment
                    cursor.execute("""
                        INSERT INTO payments (
                            id, user_id, site_id, apartment_id, amount, 
                            commission_amount, commission_rate, payment_method, 
                            status, payment_date, created_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        payment_id,
                        resident['user_id'],
                        site_id,
                        resident['apartment_id'],
                        amount,
                        commission,
                        2.00,
                        'kredi_karti',
                        'tamamlandi',
                        payment_date,
                        payment_date
                    ))
                    
                    total_payments += 1
                    total_commission += commission
                
                connection.commit()
                print(f"  ✓ Added {payments_count} payments\n")
            
            print("="*60)
            print("SUMMARY")
            print("="*60)
            print(f"✓ Total Residents Added: {total_residents}")
            print(f"✓ Total Payments Added: {total_payments}")
            print(f"✓ Total Commission: ₺{total_commission:,.2f}")
            print(f"✓ Commission Rate: 2%")
            print(f"\n✓ Test data added successfully!")
            
            cursor.close()
            
    except Error as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    add_test_data()
