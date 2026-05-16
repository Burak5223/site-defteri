#!/usr/bin/env python3
"""
Add commission system:
1. Add commission_amount and commission_rate columns to payments table
2. Update existing payments with 2% commission
3. Create test payment data with commissions
"""
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import random

def add_commission_system():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("=== Adding Commission System ===\n")
            
            # Step 1: Check if commission columns exist
            cursor.execute("SHOW COLUMNS FROM payments LIKE 'commission%'")
            existing_cols = cursor.fetchall()
            
            if len(existing_cols) >= 2:
                print("✓ Commission columns already exist")
            else:
                print("Adding commission columns...")
                
                # Add commission_amount column
                try:
                    cursor.execute("""
                        ALTER TABLE payments 
                        ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0.00 AFTER amount
                    """)
                    print("✓ Added commission_amount column")
                except Error as e:
                    if "Duplicate column" in str(e):
                        print("  commission_amount already exists")
                    else:
                        raise
                
                # Add commission_rate column
                try:
                    cursor.execute("""
                        ALTER TABLE payments 
                        ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 2.00 AFTER commission_amount
                    """)
                    print("✓ Added commission_rate column")
                except Error as e:
                    if "Duplicate column" in str(e):
                        print("  commission_rate already exists")
                    else:
                        raise
                
                connection.commit()
            
            # Step 2: Update existing payments with 2% commission
            print("\nUpdating existing payments...")
            cursor.execute("""
                UPDATE payments 
                SET commission_amount = amount * 0.02,
                    commission_rate = 2.00
                WHERE commission_amount IS NULL OR commission_amount = 0
            """)
            updated = cursor.rowcount
            connection.commit()
            print(f"✓ Updated {updated} existing payment(s)")
            
            # Step 3: Get all sites and residents
            cursor.execute("SELECT id, name FROM sites")
            sites = cursor.fetchall()
            
            print(f"\n✓ Found {len(sites)} sites")
            
            # Step 4: Create test payments for last 6 months
            total_payments = 0
            total_commission = 0
            
            for site in sites:
                site_id = site['id']
                site_name = site['name']
                
                # Get residents for this site
                cursor.execute("""
                    SELECT DISTINCT u.id as user_id, a.id as apartment_id
                    FROM users u
                    JOIN user_site_memberships usm ON u.id = usm.user_id
                    LEFT JOIN apartments a ON a.site_id = usm.site_id
                    WHERE usm.site_id = %s 
                      AND usm.role_type = 'sakin'
                      AND usm.is_deleted = 0 
                      AND usm.status = 'aktif'
                      AND a.id IS NOT NULL
                    LIMIT 20
                """, (site_id,))
                
                residents = cursor.fetchall()
                
                if not residents:
                    continue
                
                # Create 20-40 payments per site for last 6 months
                payments_count = random.randint(20, 40)
                
                for _ in range(payments_count):
                    resident = random.choice(residents)
                    
                    # Random payment amount
                    amount = random.choice([500, 750, 1000, 1250, 1500, 2000, 2500])
                    commission = round(amount * 0.02, 2)
                    
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
                            UUID(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
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
                print(f"  {site_name}: {payments_count} payments")
            
            print(f"\n{'='*60}")
            print("SUMMARY")
            print(f"{'='*60}")
            print(f"✓ Total Payments Created: {total_payments}")
            print(f"✓ Total Commission: ₺{total_commission:,.2f}")
            print(f"✓ Commission Rate: 2%")
            print(f"\n✓ Commission system added successfully!")
            
            cursor.close()
            
    except Error as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    add_commission_system()
