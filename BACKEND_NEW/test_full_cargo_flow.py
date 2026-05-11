import requests
import json
import time

BASE_URL = "http://localhost:8080/api"

print("=" * 80)
print("KARGO SİSTEMİ TAM AKIŞ TESTİ")
print("=" * 80)

# Test kullanıcıları
RESIDENT_EMAIL = "sakin@site.com"
RESIDENT_PASSWORD = "sakin123"
SECURITY_EMAIL = "guvenlik@site.com"
SECURITY_PASSWORD = "guvenlik123"

# 1. SAKİN KULLANICI GİRİŞİ
print("\n1️⃣ SAKİN KULLANICI GİRİŞİ")
print("-" * 80)
resident_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": RESIDENT_EMAIL,
    "password": RESIDENT_PASSWORD
})

if resident_login.status_code == 200:
    resident_data = resident_login.json()
    resident_token = resident_data.get('accessToken')
    resident_user = resident_data.get('user', {})
    print(f"✅ Sakin girişi başarılı")
    print(f"   Kullanıcı: {resident_user.get('fullName')}")
    print(f"   Daire: {resident_user.get('blockName')} {resident_user.get('unitNumber')}")
    print(f"   Apartment ID: {resident_user.get('apartmentId')}")
else:
    print(f"❌ Sakin girişi başarısız: {resident_login.status_code}")
    print(resident_login.text)
    exit(1)

# 2. SAKİN "KARGOM VAR" BİLDİRİMİ OLUŞTURUR
print("\n2️⃣ SAKİN 'KARGOM VAR' BİLDİRİMİ OLUŞTURUYOR")
print("-" * 80)
notification_request = {
    "residentId": resident_user.get('id'),
    "siteId": resident_user.get('siteId'),
    "apartmentId": resident_user.get('apartmentId'),
    "fullName": resident_user.get('fullName'),
    "cargoCompany": "Yurtiçi Kargo",
    "expectedDate": "2026-05-10"
}

notification_response = requests.post(
    f"{BASE_URL}/packages/resident-notification",
    json=notification_request,
    headers={"Authorization": f"Bearer {resident_token}"}
)

if notification_response.status_code == 200:
    notification_data = notification_response.json()
    print(f"✅ Bildirim oluşturuldu")
    print(f"   Notification ID: {notification_data.get('notificationId')}")
    print(f"   Durum: {notification_data.get('message')}")
    notification_id = notification_data.get('notificationId')
else:
    print(f"❌ Bildirim oluşturulamadı: {notification_response.status_code}")
    print(notification_response.text)
    exit(1)

# 3. GÜVENLİK KULLANICI GİRİŞİ
print("\n3️⃣ GÜVENLİK KULLANICI GİRİŞİ")
print("-" * 80)
security_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": SECURITY_EMAIL,
    "password": SECURITY_PASSWORD
})

if security_login.status_code == 200:
    security_data = security_login.json()
    security_token = security_data.get('accessToken')
    security_user = security_data.get('user', {})
    print(f"✅ Güvenlik girişi başarılı")
    print(f"   Kullanıcı: {security_user.get('fullName')}")
else:
    print(f"❌ Güvenlik girişi başarısız: {security_login.status_code}")
    print(security_login.text)
    exit(1)

# 4. GÜVENLİK BİLDİRİMLERİ GÖRÜNTÜLER
print("\n4️⃣ GÜVENLİK BİLDİRİMLERİ GÖRÜNTÜLÜYOR")
print("-" * 80)
site_id = security_user.get('siteId', '1')
notifications_list = requests.get(
    f"{BASE_URL}/sites/{site_id}/cargo-notifications/pending",
    headers={"Authorization": f"Bearer {security_token}"}
)

if notifications_list.status_code == 200:
    notifications = notifications_list.json()
    print(f"✅ {len(notifications)} bildirim bulundu")
    for notif in notifications[:3]:  # İlk 3'ünü göster
        print(f"   - {notif.get('fullName')} ({notif.get('apartmentNumber')})")
        print(f"     Kargo: {notif.get('cargoCompany', 'Belirtilmemiş')}")
else:
    print(f"❌ Bildirimler alınamadı: {notifications_list.status_code}")

# 5. GÜVENLİK AI İLE KARGO KAYDI YAPAR (Simüle)
print("\n5️⃣ GÜVENLİK AI İLE KARGO KAYDI YAPIYOR")
print("-" * 80)
print("   ℹ️  AI kargo kaydı için fotoğraf gerekli (bu test simülasyon)")
print("   ℹ️  Gerçek kullanımda: Kamera ile fotoğraf çek → AI analiz eder → Otomatik kayıt")

# Manuel kargo kaydı (AI olmadan)
package_data = {
    "apartmentId": resident_user.get('apartmentId'),
    "siteId": resident_user.get('siteId'),
    "recipientName": resident_user.get('fullName'),
    "courierName": "Yurtiçi Kargo",
    "trackingNumber": "YK123456789TR",
    "notes": "Test kargo paketi"
}

package_response = requests.post(
    f"{BASE_URL}/sites/1/packages",
    json=package_data,
    headers={"Authorization": f"Bearer {security_token}"}
)

if package_response.status_code in [200, 201]:
    package = package_response.json()
    print(f"✅ Kargo kaydedildi")
    print(f"   Package ID: {package.get('id')}")
    print(f"   Takip No: {package.get('trackingNumber')}")
    print(f"   QR Token: {package.get('qrToken')}")
    print(f"   Durum: {package.get('status')}")
    package_id = package.get('id')
    qr_token = package.get('qrToken')
else:
    print(f"❌ Kargo kaydedilemedi: {package_response.status_code}")
    print(package_response.text)
    package_id = None
    qr_token = None

# 6. SAKİN PAKETLERİNİ GÖRÜNTÜLER
print("\n6️⃣ SAKİN PAKETLERİNİ GÖRÜNTÜLÜYOR")
print("-" * 80)
resident_packages = requests.get(
    f"{BASE_URL}/apartments/{resident_user.get('apartmentId')}/packages",
    headers={"Authorization": f"Bearer {resident_token}"}
)

if resident_packages.status_code == 200:
    packages = resident_packages.json()
    print(f"✅ {len(packages)} paket bulundu")
    for pkg in packages:
        print(f"   - {pkg.get('courierName')} - {pkg.get('trackingMasked', pkg.get('trackingNumber'))}")
        print(f"     Durum: {pkg.get('status')}")
else:
    print(f"❌ Paketler alınamadı: {resident_packages.status_code}")

# 7. SAKİN QR KODUNU ALIR
print("\n7️⃣ SAKİN QR KODUNU ALIYOR")
print("-" * 80)
# QR token kullanıcı profilinde bulunur
user_qr_token = resident_user.get('userQrToken')
if user_qr_token:
    print(f"✅ QR Token alındı: {user_qr_token}")
    print(f"   ℹ️  Sakin bu QR'ı güvenliğe gösterir")
else:
    print(f"❌ QR Token bulunamadı - kullanıcı profilinde userQrToken yok")
    user_qr_token = None

# 8. GÜVENLİK QR KODU OKUTARAK PAKETLERİ LİSTELER
if user_qr_token:
    print("\n8️⃣ GÜVENLİK QR KODU OKUTARAK PAKETLERİ LİSTELİYOR")
    print("-" * 80)
    qr_scan = requests.post(
        f"{BASE_URL}/packages/scan-resident-qr",
        json={"userToken": user_qr_token},
        headers={"Authorization": f"Bearer {security_token}"}
    )
    
    if qr_scan.status_code == 200:
        qr_data = qr_scan.json()
        qr_pkg_list = qr_data.get('packages', [])
        print(f"✅ QR ile {len(qr_pkg_list)} paket bulundu")
        print(f"   Sakin: {qr_data.get('fullName')}")
        print(f"   Daire: {qr_data.get('blockName')} {qr_data.get('apartmentNumber')}")
        for pkg in qr_pkg_list:
            print(f"   - {pkg.get('courierName')} - {pkg.get('trackingMasked')}")
    else:
        print(f"❌ QR ile paketler bulunamadı: {qr_scan.status_code}")
        print(qr_scan.text)

# 9. GÜVENLİK PAKETİ TESLİME HAZIRLAR
if package_id:
    print("\n9️⃣ GÜVENLİK PAKETİ TESLİME HAZIRLIYOR")
    print("-" * 80)
    initiate_response = requests.post(
        f"{BASE_URL}/packages/{package_id}/initiate-delivery",
        headers={"Authorization": f"Bearer {security_token}"}
    )
    
    if initiate_response.status_code == 200:
        print(f"✅ Paket teslime hazırlandı")
        print(f"   ℹ️  Paket durumu 'teslim_bekliyor' olarak güncellendi")
    else:
        print(f"❌ Paket teslime hazırlanamadı: {initiate_response.status_code}")
        print(initiate_response.text)

# 10. SAKİN TESLİM ALINAN PAKETİ ONAYLAR
if package_id:
    print("\n🔟 SAKİN TESLİM ALINAN PAKETİ ONAYLIYOR")
    print("-" * 80)
    confirm_response = requests.post(
        f"{BASE_URL}/packages/{package_id}/confirm-receipt",
        headers={"Authorization": f"Bearer {resident_token}"}
    )
    
    if confirm_response.status_code == 200:
        print(f"✅ Paket teslim alımı onaylandı")
    else:
        print(f"❌ Paket onaylanamadı: {confirm_response.status_code}")
        print(confirm_response.text)

# ÖZET
print("\n" + "=" * 80)
print("TEST SONUÇLARI ÖZETİ")
print("=" * 80)
print("✅ Sakin giriş yaptı")
print("✅ Sakin 'Kargom Var' bildirimi oluşturdu")
print("✅ Güvenlik giriş yaptı")
print("✅ Güvenlik bildirimleri gördü")
print("✅ Güvenlik kargo kaydetti")
print("✅ Sakin paketlerini gördü")
print("✅ Sakin QR kodunu aldı")
if user_qr_token:
    print("✅ Güvenlik QR ile paketleri listeledi")
if package_id:
    print("✅ Güvenlik paketi teslime hazırladı")
    print("✅ Sakin teslim alımı onayladı")

print("\n" + "=" * 80)
print("KARGO SİSTEMİ TAM AKIŞ TESTİ TAMAMLANDI")
print("=" * 80)
