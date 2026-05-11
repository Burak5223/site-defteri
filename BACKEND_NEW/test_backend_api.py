import requests
import mysql.connector
import time

# Backend'in başlamasını bekle
print("Backend'in başlaması bekleniyor...")
for i in range(30):
    try:
        response = requests.get("http://localhost:8080/actuator/health", timeout=1)
        if response.status_code == 200:
            print("✓ Backend hazır!")
            break
    except:
        pass
    time.sleep(1)
    if i % 5 == 0:
        print(f"  {i} saniye beklendi...")
else:
    print("⚠️ Backend başlamadı, yine de test ediyoruz...")

# Bir blok ID'si al
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hilton5252.",
    database="smart_site_management"
)
cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT id, name FROM blocks WHERE site_id = '1' LIMIT 1")
block = cursor.fetchone()
cursor.close()
conn.close()

if not block:
    print("❌ Blok bulunamadı!")
    exit(1)

print(f"\nTest edilen blok: {block['name']} ({block['id']})")

# API'yi test et
try:
    url = f"http://localhost:8080/api/blocks/{block['id']}/apartments"
    print(f"\nAPI çağrısı: {url}")
    
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        apartments = response.json()
        print(f"\n✓ {len(apartments)} daire döndü")
        
        if apartments:
            print("\nİlk 5 daire:")
            for apt in apartments[:5]:
                owner = apt.get('ownerName', 'YOK')
                tenant = apt.get('currentResidentName')
                tenant_str = f" + {tenant}" if tenant else ""
                print(f"  Daire {apt['unitNumber']}: {owner}{tenant_str}")
        else:
            print("⚠️ Daire listesi boş!")
    else:
        print(f"❌ Hata: {response.text}")
        
except Exception as e:
    print(f"❌ Bağlantı hatası: {e}")
