#!/bin/bash

echo "👥 Veritabanı Kullanıcı Kontrolü"
echo "==============================="

echo "📋 Kullanıcı Tablosu Kontrolü:"
mysql -u root -pHilton5252. smart_site_management -e "
SELECT 
    id, 
    phone_number, 
    first_name, 
    last_name, 
    role, 
    site_id,
    apartment_id,
    created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
"

echo ""
echo "📋 Toplam Kullanıcı Sayısı:"
mysql -u root -pHilton5252. smart_site_management -e "
SELECT 
    COUNT(*) as toplam_kullanici,
    COUNT(CASE WHEN role = 'RESIDENT' THEN 1 END) as sakin_sayisi,
    COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admin_sayisi,
    COUNT(CASE WHEN role = 'SECURITY' THEN 1 END) as guvenlik_sayisi,
    COUNT(CASE WHEN role = 'SUPER_ADMIN' THEN 1 END) as super_admin_sayisi
FROM users;
"

echo ""
echo "📋 Site Bilgileri:"
mysql -u root -pHilton5252. smart_site_management -e "
SELECT id, name, address FROM sites LIMIT 5;
"

echo ""
echo "📋 Daire Bilgileri:"
mysql -u root -pHilton5252. smart_site_management -e "
SELECT 
    a.id, 
    a.apartment_number, 
    a.site_id,
    s.name as site_name,
    COUNT(u.id) as kullanici_sayisi
FROM apartments a 
LEFT JOIN sites s ON a.site_id = s.id
LEFT JOIN users u ON a.id = u.apartment_id
GROUP BY a.id, a.apartment_number, a.site_id, s.name
LIMIT 10;
"

echo ""
echo "📋 Mesaj Tablosu Kontrolü:"
mysql -u root -pHilton5252. smart_site_management -e "
SELECT 
    COUNT(*) as toplam_mesaj,
    COUNT(CASE WHEN message_type = 'GROUP' THEN 1 END) as grup_mesaji,
    COUNT(CASE WHEN message_type = 'SECURITY' THEN 1 END) as guvenlik_mesaji,
    COUNT(CASE WHEN message_type = 'SUPER_ADMIN' THEN 1 END) as super_admin_mesaji
FROM messages;
"

echo ""
echo "==============================="
echo "🏁 Veritabanı Kontrol Tamamlandı!"