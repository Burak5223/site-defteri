#!/usr/bin/env python3
"""
Complete script: Add residents, dues, and payments with 2% commission
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

print("=== Adding Residents, Dues, and Payments ===\n")

# Turkish names
first_names = ["Ahmet", "Mehmet", "Ayşe", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif", "Hüseyin", "Emine"]
last_names = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan"]

# Get all sites
cursor.execute("SELECT id, name FROM sites")
sites = cursor.fetchall()

total_residents = 0
total_dues = 0
total_payments = 0
total_commission = 0

for site in sites:
    site_id = site['id']
    site_name = site['name']
    
    print(f"\n{site_name}")
    print("-" * 60)
    
    # Get apartments
    cursor.execute("""
        SELECT id FROM apartments 
        WHERE site_id = %s AND is_deleted = 0
        LIMIT 30
    """, (site_id,))
    
    apartments = cursor.fetchall()
    
    if not apartments:
        print(f"  ⚠️  No apartments, skipping...")
        continue
    
    # Add 10-15 residents per site
    num_residents = min(random.randint(10, 15), len(apartments))
    selected_apartments = random.sample(apartments, num_residents)
    
    site_residents = []
    
    for apt in selected_apartments:
        # Create resident
        user_id = str(uuid.uuid4())
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        full_name = f"{first_name} {last_name}"
        email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1,999)}@test.com"
        phone = f"05{random.randint(300000000, 599999999)}"
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (
                id, email, password_hash, full_name, phone, 
                status, is_deleted, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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
        
        # Add user_site_membership
        membership_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO user_site_memberships (
                id, user_id, site_id, role_type, status, is_deleted, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            membership_id,
            user_id,
            site_id,
            'sakin',
            'aktif',
            False,
            datetime.now()
        ))
        
        # Add role
        role_id = str(uuid.uuid4())
        cursor.execute("SELECT id FROM roles WHERE name = 'ROLE_RESIDENT' LIMIT 1")
        role_result = cursor.fetchone()
        if role_result:
            cursor.execute("""
                INSERT INTO user_roles (id, user_id, role_id, created_at)
                VALUES (%s, %s, %s, %s)
            """, (str(uuid.uuid4()), user_id, role_result['id'], datetime.now()))
        
        site_residents.append({
            'user_id': user_id,
            'apartment_id': apt['id']
        })
        total_residents += 1
    
    print(f"  ✓ Added {len(site_residents)} residents")
    
    # Create dues and payments for each resident
    for resident in site_residents:
        user_id = resident['user_id']
        apartment_id = resident['apartment_id']
        
        # Create 4-6 monthly dues
        num_dues = random.randint(4, 6)
        
        for i in range(num_dues):
            # Due date (past months)
            months_ago = i
            due_date = datetime.now() - timedelta(days=30 * months_ago)
            
            # Random due amount
            due_amount = random.choice([500, 750, 1000, 1250, 1500, 2000])
            
            # 75% paid, 25% unpaid
            is_paid = random.random() < 0.75
            due_status = 'odendi' if is_paid else random.choice(['bekliyor', 'gecikmis'])
            
            # Insert due
            due_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO dues (
                    id, user_id, site_id, apartment_id, amount,
                    due_date, status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                due_id,
                user_id,
                site_id,
                apartment_id,
                due_amount,
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
                
                cursor.execute("""
                    INSERT INTO payments (
                        id, user_id, site_id, apartment_id, amount,
                        commission_amount, commission_rate, payment_method,
                        status, payment_date, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    payment_id,
                    user_id,
                    site_id,
                    apartment_id,
                    due_amount,
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
    print(f"  ✓ Added {total_dues - (total_dues - num_dues * len(site_residents))} dues")
    print(f"  ✓ Added {total_payments - (total_payments - int(num_dues * len(site_residents) * 0.75))} payments")

print(f"\n{'='*60}")
print("SUMMARY")
print(f"{'='*60}")
print(f"✓ Total Residents: {total_residents}")
print(f"✓ Total Dues: {total_dues}")
print(f"✓ Total Payments: {total_payments}")
print(f"✓ Total Commission: ₺{total_commission:,.2f}")
print(f"✓ Average Commission per Payment: ₺{(total_commission/total_payments if total_payments > 0 else 0):,.2f}")

cursor.close()
connection.close()

print(f"\n✓ All data added successfully!")
