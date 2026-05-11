#!/usr/bin/env python3
"""
Demo Verilerini Hazırlama Script'i
Sunuma hazırlık için gerçekçi demo verileri oluşturur
"""

import mysql.connector
from datetime import datetime, timedelta
import random
import uuid

# Veritabanı bağlantısı
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor()

print("=" * 80)
print("DEMO VERİLERİNİ HAZIRLAMA")
print("=" * 80)

# 1. Eski finans verilerini temizle
print("\n1. Eski finans verilerini temizliyorum...")
# First delete payments that reference dues with high amounts
cursor.execute("""
    DELETE p FROM payments p
    INNER JOIN dues d ON p.due_id = d.id
    WHERE d.total_amount > 5000
""")
cursor.execute("DELETE FROM payments WHERE amount > 10000")
cursor.execute("DELETE FROM dues WHERE total_amount > 5000")
cursor.execute("DELETE FROM incomes WHERE amount > 1000000")
cursor.execute("DELETE FROM expenses WHERE amount > 100000")
conn.commit()
print("✓ Eski finans verileri temizlendi")

# 2. Gerçekçi aidatlar oluştur (son 3 ay)
print("\n2. Gerçekçi aidatlar oluşturuluyor...")
cursor.execute("DELETE FROM payments")  # Delete all payments first
cursor.execute("DELETE FROM dues")
conn.commit()

# Tüm daireleri al
cursor.execute("""
    SELECT a.id, a.unit_number, b.name as block_name
    FROM apartments a
    JOIN blocks b ON a.block_id = b.id
    WHERE a.site_id = 1
    ORDER BY b.name, a.unit_number
""")
apartments = cursor.fetchall()

due_amounts = [1500, 1800, 2000, 2200, 2500]  # Farklı aidat miktarları
months = [
    (datetime.now() - timedelta(days=60), "Kasım 2024"),
    (datetime.now() - timedelta(days=30), "Aralık 2024"),
    (datetime.now(), "Ocak 2025")
]

for apartment_id, unit_number, block_name in apartments:
    for month_date, month_name in months:
        amount = random.choice(due_amounts)
        due_date = month_date + timedelta(days=10)
        
        # %70 ödenmiş, %30 ödenmemiş
        status = 'odendi' if random.random() < 0.7 else 'bekliyor'
        
        cursor.execute("""
            INSERT INTO dues (apartment_id, base_amount, total_amount, currency_code, due_date, status, description, created_at)
            VALUES (%s, %s, %s, 'TRY', %s, %s, %s, %s)
        """, (apartment_id, amount, amount, due_date, status, f"{month_name} Aidatı", month_date))

conn.commit()
print(f"✓ {len(apartments) * 3} aidat kaydı oluşturuldu")

# 3. Gerçekçi gelirler ekle
print("\n3. Gerçekçi gelirler ekleniyor...")
cursor.execute("DELETE FROM incomes")
conn.commit()

income_data = [
    ("Aidat Gelirleri", 150000, -30),
    ("Aidat Gelirleri", 145000, -60),
    ("Otopark Kira Geliri", 5000, -15),
    ("Ortak Alan Kira Geliri", 3000, -20),
    ("Gecikme Faizi", 1200, -10),
]

for description, amount, days_ago in income_data:
    date = datetime.now() + timedelta(days=days_ago)
    income_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO incomes (id, site_id, amount, currency_code, description, income_date, category, created_at)
        VALUES (%s, 1, %s, 'TRY', %s, %s, 'AIDAT', %s)
    """, (income_id, amount, description, date, date))

conn.commit()
print(f"✓ {len(income_data)} gelir kaydı oluşturuldu")

# 4. Gerçekçi giderler ekle
print("\n4. Gerçekçi giderler ekleniyor...")
cursor.execute("DELETE FROM expenses")
conn.commit()

expense_data = [
    ("Elektrik Faturası", 12000, "FATURA", -5),
    ("Su Faturası", 8000, "FATURA", -5),
    ("Doğalgaz Faturası", 15000, "FATURA", -5),
    ("Temizlik Malzemeleri", 3500, "MALZEME", -10),
    ("Asansör Bakımı", 4000, "BAKIM", -15),
    ("Bahçe Bakımı", 2500, "BAKIM", -20),
    ("Güvenlik Personel Maaşı", 25000, "PERSONEL", -3),
    ("Temizlik Personel Maaşı", 20000, "PERSONEL", -3),
    ("Boya Badana İşçiliği", 8000, "ONARIM", -25),
    ("Kapı Tamiri", 1500, "ONARIM", -30),
]

for description, amount, category, days_ago in expense_data:
    date = datetime.now() + timedelta(days=days_ago)
    expense_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO expenses (id, site_id, amount, currency_code, description, expense_date, category, status, created_at)
        VALUES (%s, 1, %s, 'TRY', %s, %s, %s, 'approved', %s)
    """, (expense_id, amount, description, date, category, date))

conn.commit()
print(f"✓ {len(expense_data)} gider kaydı oluşturuldu")

# 5. Duyurular ekle
print("\n5. Duyurular ekleniyor...")
cursor.execute("DELETE FROM announcements WHERE site_id = '1'")
conn.commit()

announcements = [
    ("Genel Kurul Toplantısı", "Sayın site sakinleri, yıllık olağan genel kurul toplantımız 15 Şubat 2025 Cumartesi günü saat 14:00'te site toplantı salonunda yapılacaktır. Katılımınızı rica ederiz.", "orta", -2),
    ("Su Kesintisi Bildirimi", "Yarın saat 09:00-12:00 arası şebeke bakımı nedeniyle sitemizde su kesintisi yaşanacaktır. Anlayışınız için teşekkür ederiz.", "acil", -1),
    ("Asansör Bakımı", "A Blok asansörü periyodik bakım için 20 Ocak Pazartesi günü saat 10:00-16:00 arası hizmet dışı kalacaktır.", "orta", -5),
    ("Otopark Düzenlemesi", "Otopark alanında yeni düzenleme yapılmıştır. Lütfen araçlarınızı belirlenen park yerlerine park ediniz.", "dusuk", -10),
    ("Yılbaşı Kutlaması", "Tüm site sakinlerimizin yeni yılını kutlar, sağlık ve mutluluk dolu günler dileriz.", "dusuk", -15),
]

for title, body, priority, days_ago in announcements:
    date = datetime.now() + timedelta(days=days_ago)
    cursor.execute("""
        INSERT INTO announcements (site_id, title, body, priority, published_at, created_at)
        VALUES ('1', %s, %s, %s, %s, %s)
    """, (title, body, priority, date, date))

conn.commit()
print(f"✓ {len(announcements)} duyuru oluşturuldu")

# 6. Arıza bildirimleri ekle
print("\n6. Arıza bildirimleri ekleniyor...")
cursor.execute("DELETE FROM tickets WHERE site_id = '1'")
conn.commit()

# Rastgele daireler seç
sample_apartments = random.sample(apartments, min(15, len(apartments)))

ticket_data = [
    ("Asansör Arızası", "A Blok asansörü çalışmıyor, acil müdahale gerekiyor.", "acil", "acik"),
    ("Sızdıran Musluk", "Mutfak musluğu sürekli damlıyor, tamir edilmesi gerekiyor.", "orta", "islemde"),
    ("Kapı Kilidi Sorunu", "Giriş kapısı kilidi sıkışıyor, açılmıyor.", "dusuk", "cozuldu"),
    ("Elektrik Kesintisi", "Dairemde elektrik gidiyor geliyor.", "acil", "acik"),
    ("Tesisat Tıkanıklığı", "Lavabo tıkalı, su akmıyor.", "orta", "islemde"),
    ("Petek Isınmıyor", "Yatak odasındaki petek ısınmıyor.", "orta", "acik"),
    ("Cam Kırığı", "Balkon camı çatlamış, değiştirilmesi gerekiyor.", "dusuk", "cozuldu"),
    ("İnternet Sorunu", "İnternet bağlantısı çok yavaş.", "dusuk", "cozuldu"),
    ("Ses İzolasyonu", "Üst kattan gelen gürültü rahatsız edici.", "dusuk", "acik"),
    ("Bahçe Aydınlatması", "Bahçe lambaları yanmıyor.", "dusuk", "islemde"),
]

# Get a user_id for tickets (use first resident)
cursor.execute("SELECT id FROM users WHERE site_id = '1' LIMIT 1")
ticket_user = cursor.fetchone()
ticket_user_id = ticket_user[0] if ticket_user else None

for i, (title, description, priority, status) in enumerate(ticket_data[:len(sample_apartments)]):
    if not ticket_user_id:
        break
    apartment_id = sample_apartments[i][0]
    days_ago = random.randint(1, 30)
    date = datetime.now() - timedelta(days=days_ago)
    ticket_number = f"TKT-{datetime.now().year}-{str(i+1).zfill(4)}"
    
    cursor.execute("""
        INSERT INTO tickets (ticket_number, user_id, site_id, apartment_id, title, description, priority, status, created_at)
        VALUES (%s, %s, '1', %s, %s, %s, %s, %s, %s)
    """, (ticket_number, ticket_user_id, apartment_id, title, description, priority, status, date))

conn.commit()
print(f"✓ {len(ticket_data)} arıza bildirimi oluşturuldu")

# 7. Ziyaretçi talepleri ekle
print("\n7. Ziyaretçi talepleri ekleniyor...")
cursor.execute("DELETE FROM visitor_requests WHERE site_id = '1'")
conn.commit()

# Get a user_id for visitor requests
cursor.execute("SELECT id FROM users WHERE site_id = '1' LIMIT 1")
visitor_user = cursor.fetchone()
visitor_user_id = visitor_user[0] if visitor_user else None

for i in range(12):
    if not visitor_user_id:
        break
    apartment_id = random.choice(apartments)[0]
    days_ahead = random.randint(0, 7)
    visit_date = datetime.now() + timedelta(days=days_ahead)
    
    status = random.choice(['approved', 'pending', 'rejected'])
    visitor_id = str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO visitor_requests (id, site_id, apartment_id, requested_by, expected_visit_date, status, created_at)
        VALUES (%s, '1', %s, %s, %s, %s, %s)
    """, (visitor_id, apartment_id, visitor_user_id, visit_date, status, datetime.now() - timedelta(days=random.randint(0, 5))))

conn.commit()
print(f"✓ 12 ziyaretçi talebi oluşturuldu")

# 8. Kargo kayıtları ekle
print("\n8. Kargo kayıtları ekleniyor...")
cursor.execute("DELETE FROM packages WHERE site_id = '1'")
conn.commit()

cargo_companies = ["Aras Kargo", "Yurtiçi Kargo", "MNG Kargo", "PTT Kargo", "Sürat Kargo"]

for i in range(20):
    apartment_id = random.choice(apartments)[0]
    company = random.choice(cargo_companies)
    days_ago = random.randint(0, 10)
    recorded_date = datetime.now() - timedelta(days=days_ago)
    
    # %60 teslim edilmiş, %40 bekliyor
    status = 'delivered' if random.random() < 0.6 else 'received'
    delivered_date = recorded_date + timedelta(days=random.randint(1, 3)) if status == 'delivered' else None
    package_id = str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO packages (id, site_id, apartment_id, tracking_number, courier_name, 
                            recorded_at, status, delivered_at, created_at, is_deleted)
        VALUES (%s, '1', %s, %s, %s, %s, %s, %s, %s, 0)
    """, (package_id, apartment_id, f"TRK{random.randint(100000, 999999)}", company, 
          recorded_date, status, delivered_date, recorded_date))

conn.commit()
print(f"✓ 20 kargo kaydı oluşturuldu")

# 9. Oylama ekle
print("\n9. Oylama ekleniyor...")
# Delete voting_options first, then votings
cursor.execute("""
    DELETE vo FROM voting_options vo
    INNER JOIN votings v ON vo.voting_id = v.id
    WHERE v.site_id = '1'
""")
cursor.execute("DELETE FROM votings WHERE site_id = '1'")
conn.commit()

votings = [
    ("Yeni Oyun Parkı Yapımı", "Sitenin arka bahçesine çocuklar için yeni bir oyun parkı yapılması önerisi", 7),
    ("Güvenlik Kamerası Eklenmesi", "Otopark alanına 4 adet yeni güvenlik kamerası eklenmesi", 3),
    ("Havuz Yenileme Projesi", "Yüzme havuzunun yenilenmesi ve modernize edilmesi", -5),
]

# Get a user_id for created_by
cursor.execute("SELECT id FROM users WHERE site_id = '1' LIMIT 1")
voting_user = cursor.fetchone()
voting_user_id = voting_user[0] if voting_user else None

for title, description, days_offset in votings:
    if not voting_user_id:
        break
    start_date = datetime.now() + timedelta(days=days_offset)
    end_date = start_date + timedelta(days=14)
    status = 'AKTIF' if days_offset > 0 else 'TAMAMLANDI'
    
    cursor.execute("""
        INSERT INTO votings (site_id, title, description, start_date, end_date, status, created_at, created_by)
        VALUES ('1', %s, %s, %s, %s, %s, %s, %s)
    """, (title, description, start_date, end_date, status, start_date, voting_user_id))

conn.commit()
print(f"✓ {len(votings)} oylama oluşturuldu")

# 10. Bakım ekipmanları ekle
print("\n10. Bakım ekipmanları ekleniyor...")
cursor.execute("DELETE FROM maintenance_equipment WHERE site_id = '1'")
conn.commit()

equipment_data = [
    ("Asansör - A Blok", "Asansör", "2024-12-15", "2025-01-15", "AKTIF", 30),
    ("Asansör - B Blok", "Asansör", "2024-12-15", "2025-01-15", "AKTIF", 30),
    ("Asansör - C Blok", "Asansör", "2024-11-20", "2025-01-15", "BAKIM_GEREKLI", 30),
    ("Jeneratör", "Elektrik", "2024-11-20", "2024-12-20", "BAKIM_GEREKLI", 30),
    ("Yangın Söndürme Sistemi", "Güvenlik", "2024-12-10", "2026-03-10", "AKTIF", 365),
    ("Su Deposu Pompası", "Tesisat", "2024-12-05", "2025-08-05", "AKTIF", 180),
    ("Isıtma Kazanı", "Isıtma", "2024-12-01", "2025-11-01", "AKTIF", 365),
]

for name, equipment_type, last_maintenance, next_maintenance, status, interval_days in equipment_data:
    equipment_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO maintenance_equipment (id, site_id, equipment_name, equipment_type, last_maintenance_date, 
                                          next_maintenance_date, maintenance_interval_days, status, created_at)
        VALUES (%s, '1', %s, %s, %s, %s, %s, %s, NOW())
    """, (equipment_id, name, equipment_type, last_maintenance, next_maintenance, interval_days, status))

conn.commit()
print(f"✓ {len(equipment_data)} bakım ekipmanı oluşturuldu")

# 11. Güvenlik ve temizlik görevleri ekle
print("\n11. Güvenlik ve temizlik görevleri ekleniyor...")
cursor.execute("DELETE FROM tasks WHERE site_id = '1'")
conn.commit()

# Skip tasks for now - complex role structure
print(f"✓ 0 görev oluşturuldu (atlandı)")

# Özet bilgileri göster
print("\n" + "=" * 80)
print("DEMO VERİLERİ BAŞARIYLA OLUŞTURULDU!")
print("=" * 80)

# İstatistikler
cursor.execute("SELECT COUNT(*) FROM dues WHERE status = 'bekliyor'")
pending_dues = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM dues WHERE status = 'odendi'")
paid_dues = cursor.fetchone()[0]

cursor.execute("SELECT SUM(amount) FROM incomes WHERE site_id = '1'")
total_income = cursor.fetchone()[0] or 0

cursor.execute("SELECT SUM(amount) FROM expenses WHERE site_id = '1'")
total_expense = cursor.fetchone()[0] or 0

cursor.execute("SELECT COUNT(*) FROM announcements WHERE site_id = '1'")
total_announcements = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM tickets WHERE site_id = '1' AND status = 'acik'")
open_tickets = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM packages WHERE site_id = '1' AND status = 'received'")
waiting_packages = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM visitor_requests WHERE site_id = '1' AND status = 'pending'")
pending_visitors = cursor.fetchone()[0]

print(f"\n📊 İSTATİSTİKLER:")
print(f"  • Bekleyen Aidatlar: {pending_dues}")
print(f"  • Ödenen Aidatlar: {paid_dues}")
print(f"  • Toplam Gelir: ₺{total_income:,.2f}")
print(f"  • Toplam Gider: ₺{total_expense:,.2f}")
print(f"  • Bakiye: ₺{(total_income - total_expense):,.2f}")
print(f"  • Duyurular: {total_announcements}")
print(f"  • Açık Arızalar: {open_tickets}")
print(f"  • Bekleyen Kargolar: {waiting_packages}")
print(f"  • Bekleyen Ziyaretçiler: {pending_visitors}")

print("\n✅ Proje sunuma hazır!")
print("=" * 80)

cursor.close()
conn.close()
