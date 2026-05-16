#!/usr/bin/env python3
"""
Add test dues and payments with 2% commission for super admin dashboard
Uses correct table structure: dues (apartment_id), payments (user_id, site_id, commission)
"""
import mysql.connector
from datetime import datetime, timedelta
import random
import uuid

connection = mysql.connector.connect(
    host='localhost',
    database='smart_site_management',
    user='root',
    password='Hilton5252.'
)

cursor = connection.cursor(dictionary=True)

print("=== Adding Test Dues and Payments ===\n")

# Get all sites
cursor.execute("SELECT id, name FROM sites")
sites = cursor.fetchall()

total_dues = 0
total_payments = 0
total_commission = 0

for site in sites:
    site_id = site['id']
    site_name = site['name']
    
    print(f"\n{site_name}")
    print("-" * 60)
    
    # Get apartments with residents for this site
    cursor.execute("""
        SELECT a.id as apartment_id, a.current_resident_id as user_id
        FROM apartments a
        WHERE a.site_id = %s 
          AND a.is_deleted = 0
          AND a.current_resident_id IS NOT NULL
          AND a.current_resident_id != ''
        LIMIT 50
    """, (site_id,))
    
    apartments_with_residents = cursor.fetchall()
    
    if not apartments_with_residents:
        print(f"  ⚠️  No apartments with residents found, skipping...")
        continue
    
    print(f"  Found {len(apartments_with_residents)} apartment(s) with residents")
    
    # Create dues and payments for last 6 months
    for apt in apartments_with_residents:
        apartment_id = apt['apartment_id']
        user_id = apt['user_id']
        
        # Create 3-6 dues (monthly)
        num_dues = random.randint(3, 6)
        
        for i in range(num_dues):
            # Due date (past months)
            months_ago = i
            due_date = datetime.now() - timedelta(days=30 * months_ago)
            
            # Random due amount
            due_amount = random.choice([500, 750, 1000, 1250, 1500])
            
            # 70% paid, 30% unpaid
            is_paid = random.random() < 0.7
            due_status = 'odendi' if is_paid else random.choice(['bekliyor', 'gecikmis'])
            
            # Insert due
            due_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO dues (
                    id, apartment_id, base_amount, total_amount,
                    currency_code, due_date, status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                due_id,
                apartment_id,
                due_amount,
                due_amount,
                'TRY',
                due_date,
                due_status,
                due_date - timedelta(days=5)
            ))
            total_dues += 1
            
            # If paid, create payment with 2% commission
            if is_paid:
                payment_id = str(uuid.uuid4())
                commission = round(due_amount * 0.02, 2)
                payment_date = due_date + timedelta(days=random.randint(1, 10))
                idempotency_key = f"test_{payment_id}"
                
                cursor.execute("""
                    INSERT INTO payments (
                        id, due_id, user_id, site_id, amount,
                        commission_amount, commission_rate, currency_code,
                        payment_method, idempotency_key, status, 
                        payment_date, paid_at, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    payment_id,
                    due_id,
                    user_id,
                    site_id,
                    due_amount,
                    commission,
                    2.00,
                    'TRY',
                    'kredi_karti',
                    idempotency_key,
                    'tamamlandi',
                    payment_date,
                    payment_date,
                    payment_date
                ))
                total_payments += 1
                total_commission += commission
    
    connection.commit()
    print(f"  ✓ Added dues and payments")

print(f"\n{'='*60}")
print("SUMMARY")
print(f"{'='*60}")
print(f"✓ Total Dues Created: {total_dues}")
print(f"✓ Total Payments Created: {total_payments}")
print(f"✓ Total Commission: ₺{total_commission:,.2f}")
print(f"✓ Commission Rate: 2%")

cursor.close()
connection.close()

print(f"\n✓ Test data added successfully!")
