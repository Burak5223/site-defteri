import mysql.connector
import requests

# Database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="site_yonetim"
)

cursor = db.cursor(dictionary=True)

print("=" * 80)
print("ARIZALAR (TICKETS) KONTROL")
print("=" * 80)

# Tüm arızaları kontrol et
cursor.execute("""
    SELECT t.*, 
           u.username as reporter_username,
           u.email as reporter_email,
           a.apartment_number,
           a.block_name
    FROM tickets t
    LEFT JOIN users u ON t.reporter_id = u.id
    LEFT JOIN apartments a ON t.apartment_id = a.id
    ORDER BY t.id
""")
tickets = cursor.fetchall()

print(f"\nToplam Arıza Sayısı: {len(tickets)}")
print("\nArıza Detayları:")
for ticket in tickets:
    print(f"\nID: {ticket['id']}")
    print(f"  Başlık: {ticket['title']}")
    print(f"  Durum: {ticket['status']}")
    print(f"  Site ID: {ticket['site_id']}")
    print(f"  Reporter ID: {ticket['reporter_id']}")
    print(f"  Reporter: {ticket['reporter_username']} ({ticket['reporter_email']})")
    print(f"  Apartment ID: {ticket['apartment_id']}")
    if ticket['apartment_number']:
        print(f"  Daire: {ticket['block_name']} - {ticket['apartment_number']}")

# Kullanıcıları kontrol et
print("\n" + "=" * 80)
print("KULLANICI KONTROL")
print("=" * 80)

cursor.execute("""
    SELECT u.id, u.username, u.email, u.site_id,
           GROUP_CONCAT(DISTINCT r.name) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.email IN ('admin@site.com', 'sakin@site.com')
    GROUP BY u.id
""")
users = cursor.fetchall()

for user in users:
    print(f"\nKullanıcı: {user['username']} ({user['email']})")
    print(f"  ID: {user['id']}")
    print(f"  Site ID: {user['site_id']}")
    print(f"  Roller: {user['roles']}")
    
    # Bu kullanıcının dairelerini kontrol et
    cursor.execute("""
        SELECT a.id, a.apartment_number, a.block_name, a.site_id,
               r.residency_type
        FROM residency r
        JOIN apartments a ON r.apartment_id = a.id
        WHERE r.user_id = %s
    """, (user['id'],))
    apartments = cursor.fetchall()
    
    if apartments:
        print(f"  Daireleri:")
        for apt in apartments:
            print(f"    - {apt['block_name']} - {apt['apartment_number']} (Site: {apt['site_id']}, Tip: {apt['residency_type']})")
    else:
        print(f"  Dairesi YOK!")

# API testleri
print("\n" + "=" * 80)
print("API TEST - ADMIN")
print("=" * 80)

# Admin login
admin_response = requests.post('http://localhost:8080/api/auth/login', json={
    'email': 'admin@site.com',
    'password': 'admin123'
})

if admin_response.status_code == 200:
    admin_token = admin_response.json()['token']
    print("Admin giriş başarılı")
    
    # Admin dashboard
    dashboard_response = requests.get(
        'http://localhost:8080/api/dashboard/stats',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    
    if dashboard_response.status_code == 200:
        stats = dashboard_response.json()
        print(f"Admin Dashboard - Açık Arızalar: {stats.get('openTickets', 0)}")
    
    # Admin tickets
    tickets_response = requests.get(
        'http://localhost:8080/api/tickets',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    
    if tickets_response.status_code == 200:
        admin_tickets = tickets_response.json()
        print(f"Admin Arıza Listesi: {len(admin_tickets)} arıza")

print("\n" + "=" * 80)
print("API TEST - SAKİN")
print("=" * 80)

# Sakin login
sakin_response = requests.post('http://localhost:8080/api/auth/login', json={
    'email': 'sakin@site.com',
    'password': 'sakin123'
})

if sakin_response.status_code == 200:
    sakin_token = sakin_response.json()['token']
    print("Sakin giriş başarılı")
    
    # Sakin dashboard
    dashboard_response = requests.get(
        'http://localhost:8080/api/dashboard/stats',
        headers={'Authorization': f'Bearer {sakin_token}'}
    )
    
    if dashboard_response.status_code == 200:
        stats = dashboard_response.json()
        print(f"Sakin Dashboard - Açık Arızalar: {stats.get('openTickets', 0)}")
    else:
        print(f"Dashboard hatası: {dashboard_response.status_code}")
        print(dashboard_response.text)
    
    # Sakin tickets
    tickets_response = requests.get(
        'http://localhost:8080/api/tickets',
        headers={'Authorization': f'Bearer {sakin_token}'}
    )
    
    if tickets_response.status_code == 200:
        sakin_tickets = tickets_response.json()
        print(f"Sakin Arıza Listesi: {len(sakin_tickets)} arıza")
    else:
        print(f"Tickets hatası: {tickets_response.status_code}")
        print(tickets_response.text)

cursor.close()
db.close()
