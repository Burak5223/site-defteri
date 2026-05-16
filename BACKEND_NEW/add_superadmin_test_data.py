#!/usr/bin/env python3
"""
Add comprehensive test data for Super Admin dashboard
- Residents across all sites
- Payments with commission
- Tickets (open and closed)
- Packages (waiting and delivered)
- Dues (paid and unpaid)
"""
import mysql.connector
from mysql.connector import Error
import uuid
from datetime import datetime, timedelta
import random

def generate_uuid():
    return str(uuid.uuid4())

def add_superadmin_test_data():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='smart_site_management',
            user='root',
            password='Hilton5252.'
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            print("=== Adding Super Admin Test Data ===\n")
            
            # Get all sites
            cursor.execute("SELECT id, name FROM sites ORDER BY name")
            sites = cursor.fetchall()
            
            print(f"Found {len(sites)} sites\n")
            
            # Turkish names for residents
            first_names = [
                "Ahmet", "Mehmet", "Ayşe", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif",
                "Hüseyin", "Emine", "Hasan", "Hatice", "İbrahim", "Merve", "Yusuf", "Selin",
                "Ömer", "Esra", "Murat", "Büşra", "Emre", "Şeyma", "Burak", "Rabia",
                "Serkan", "Kübra", "Kemal", "Yasemin", "Oğuz", "Betül"
            ]
            
            last_names = [
                "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk",
                "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt",
                "Özdemir", "Şimşek", "Erdoğan", "Güneş", "Aksoy", "Avcı", "Türk", "Polat"
            ]
            
            total_residents_added = 0
            total_payments_added = 0
            total_tickets_added = 0
            total_packages_added = 0
            total_dues_added = 0
            
            for site in sites:
                site_id = site['id']
                site_name = site['name']
                
                print(f"\n{'='*60}")
                print(f"Site: {site_name}")
                print(f"{'='*60}")
                
                # Get apartments for this site
                cursor.execute("""
                    SELECT id, apartment_number, block_name 
                    FROM apartments 
                    WHERE site_id = %s AND is_deleted = 0
                    ORDER BY block_name, apartment_number
                """, (site_id,))
                apartments = cursor.fetchall()
                
                print(f"Found {len(apartments)} apartments")
                
                # Add 10-20 residents per site
                residents_to_add = min(random.randint(10, 20), len(apartments))
                selected_apartments = random.sample(apartments, residents_to_add)
                
                site_residents = []
                
                for apt in selected_apartments:
                    # Create resident user
                    user_id = generate_uuid()
                    first_name = random.choice(first_names)
                    last_name = random.choice(last_names)
                    full_name = f"{first_name} {last_name}"
                    email = f"{first_name.lower()}.{last_name.lower()}.{apt['apartment_number']}@{site_name.lower().replace(' ', '')}.com"
                    phone = f"05{random.randint(300000000, 599999999)}"
                    
                    # Insert user
                    cursor.execute("""
                        INSERT INTO users (id, email, password, full_name, phone, role, status, is_deleted, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        user_id,
                        email,
                        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKZblo6QLG',  # admin123
                        full_name,
                        phone,
                        'RESIDENT',
                        'aktif',
                        False,
                        datetime.now()
                    ))
                    
                    # Add user_site_membership
                    membership_id = generate_uuid()
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
                    
                    # Add residency
                    residency_id = generate_uuid()
                    residency_type = random.choice(['mal_sahibi', 'kiraci'])
                    cursor.execute("""
                        INSERT INTO residency (id, user_id, apartment_id, site_id, residency_type, status, is_deleted, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        residency_id,
                        user_id,
                        apt['id'],
                        site_id,
                        residency_type,
                        'aktif',
                        False,
                        datetime.now()
                    ))
                    
                    site_residents.append({
                        'user_id': user_id,
                        'apartment_id': apt['id'],
                        'full_name': full_name
                    })
                    total_residents_added += 1
                
                print(f"✓ Added {len(site_residents)} residents")
                
                # Add payments with commission (last 6 months)
                payments_count = random.randint(30, 60)
                for _ in range(payments_count):
                    if not site_residents:
                        break
                    
                    resident = random.choice(site_residents)
                    payment_id = generate_uuid()
                    amount = random.choice([500, 750, 1000, 1250, 1500, 2000])
                    commission = amount * 0.02  # 2% commission
                    payment_date = datetime.now() - timedelta(days=random.randint(0, 180))
                    
                    cursor.execute("""
                        INSERT INTO payments (id, user_id, site_id, apartment_id, amount, commission_amount, 
                                            payment_method, status, payment_date, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        payment_id,
                        resident['user_id'],
                        site_id,
                        resident['apartment_id'],
                        amount,
                        commission,
                        'kredi_karti',
                        'tamamlandi',
                        payment_date,
                        payment_date
                    ))
                    total_payments_added += 1
                
                print(f"✓ Added {payments_count} payments")
                
                # Add tickets (mix of open and closed)
                tickets_count = random.randint(15, 30)
                ticket_statuses = ['acik', 'islemde', 'cozuldu', 'kapali']
                ticket_priorities = ['dusuk', 'normal', 'yuksek', 'acil']
                ticket_categories = ['elektrik', 'su', 'isitma', 'asansor', 'genel']
                
                for _ in range(tickets_count):
                    if not site_residents:
                        break
                    
                    resident = random.choice(site_residents)
                    ticket_id = generate_uuid()
                    status = random.choice(ticket_statuses)
                    created_date = datetime.now() - timedelta(days=random.randint(0, 90))
                    
                    cursor.execute("""
                        INSERT INTO tickets (id, user_id, site_id, apartment_id, title, description, 
                                           category, priority, status, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        ticket_id,
                        resident['user_id'],
                        site_id,
                        resident['apartment_id'],
                        f"{random.choice(ticket_categories).title()} Arızası",
                        "Test arıza kaydı",
                        random.choice(ticket_categories),
                        random.choice(ticket_priorities),
                        status,
                        created_date
                    ))
                    total_tickets_added += 1
                
                print(f"✓ Added {tickets_count} tickets")
                
                # Add packages (mix of waiting and delivered)
                packages_count = random.randint(20, 40)
                package_statuses = ['bekliyor', 'teslim_edildi']
                
                for _ in range(packages_count):
                    if not site_residents:
                        break
                    
                    resident = random.choice(site_residents)
                    package_id = generate_uuid()
                    status = random.choice(package_statuses)
                    received_date = datetime.now() - timedelta(days=random.randint(0, 30))
                    
                    cursor.execute("""
                        INSERT INTO packages (id, user_id, site_id, apartment_id, sender_name, 
                                            tracking_number, status, received_at, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        package_id,
                        resident['user_id'],
                        site_id,
                        resident['apartment_id'],
                        random.choice(['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo']),
                        f"TRK{random.randint(100000000, 999999999)}",
                        status,
                        received_date,
                        received_date
                    ))
                    total_packages_added += 1
                
                print(f"✓ Added {packages_count} packages")
                
                # Add dues (mix of paid and unpaid)
                dues_count = random.randint(20, 40)
                due_statuses = ['bekliyor', 'odendi', 'gecikmis']
                
                for _ in range(dues_count):
                    if not site_residents:
                        break
                    
                    resident = random.choice(site_residents)
                    due_id = generate_uuid()
                    status = random.choice(due_statuses)
                    amount = random.choice([500, 750, 1000, 1250, 1500])
                    due_date = datetime.now() - timedelta(days=random.randint(-30, 90))
                    
                    cursor.execute("""
                        INSERT INTO dues (id, user_id, site_id, apartment_id, amount, 
                                        due_date, status, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        due_id,
                        resident['user_id'],
                        site_id,
                        resident['apartment_id'],
                        amount,
                        due_date,
                        status,
                        datetime.now() - timedelta(days=random.randint(30, 120))
                    ))
                    total_dues_added += 1
                
                print(f"✓ Added {dues_count} dues")
            
            connection.commit()
            
            print(f"\n{'='*60}")
            print("SUMMARY")
            print(f"{'='*60}")
            print(f"✓ Total Residents Added: {total_residents_added}")
            print(f"✓ Total Payments Added: {total_payments_added}")
            print(f"✓ Total Tickets Added: {total_tickets_added}")
            print(f"✓ Total Packages Added: {total_packages_added}")
            print(f"✓ Total Dues Added: {total_dues_added}")
            print(f"\n✓ Super Admin test data added successfully!")
            
            cursor.close()
            
    except Error as e:
        print(f"❌ Database error: {e}")
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    add_superadmin_test_data()
