#!/bin/bash

echo "🔐 MySQL Şifre Düzeltme Scripti"
echo "==============================="

echo "🔍 Adım 1: MySQL'i Güvenli Modda Durdur"
sudo systemctl stop mysql

echo ""
echo "🔍 Adım 2: MySQL'i Güvenli Modda Başlat (şifresiz)"
sudo mysqld_safe --skip-grant-tables --skip-networking &
MYSQLD_PID=$!

echo "MySQL güvenli mod başlatıldı (PID: $MYSQLD_PID)"
sleep 5

echo ""
echo "🔍 Adım 3: Root Şifresini Sıfırla"
mysql -u root << EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Hilton5252.';
FLUSH PRIVILEGES;
EXIT;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Root şifresi başarıyla değiştirildi"
else
    echo "❌ Root şifresi değiştirilemedi, alternatif yöntem deneniyor..."
    
    # Alternatif yöntem
    mysql -u root << EOF
USE mysql;
UPDATE user SET authentication_string=PASSWORD('Hilton5252.') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Root şifresi alternatif yöntemle değiştirildi"
    else
        echo "❌ Root şifresi değiştirilemedi"
    fi
fi

echo ""
echo "🔍 Adım 4: Güvenli Modu Durdur"
sudo kill $MYSQLD_PID
sleep 3

echo ""
echo "🔍 Adım 5: MySQL'i Normal Modda Başlat"
sudo systemctl start mysql
sleep 3

echo ""
echo "🔍 Adım 6: Bağlantı Testi"
mysql -u root -p'Hilton5252.' -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Veritabanı bağlantısı başarılı!"
    
    echo ""
    echo "🔍 Adım 7: Veritabanı Oluştur"
    mysql -u root -p'Hilton5252.' -e "CREATE DATABASE IF NOT EXISTS smart_site_management;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Veritabanı 'smart_site_management' oluşturuldu"
        
        echo ""
        echo "🔍 Adım 8: Kullanıcı İzinleri"
        mysql -u root -p'Hilton5252.' << EOF
GRANT ALL PRIVILEGES ON smart_site_management.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON smart_site_management.* TO 'root'@'%';
FLUSH PRIVILEGES;
EOF
        echo "✅ Kullanıcı izinleri verildi"
    else
        echo "❌ Veritabanı oluşturulamadı"
    fi
else
    echo "❌ Veritabanı bağlantısı hala başarısız"
    echo ""
    echo "🔍 Alternatif: Şifresiz Root Erişimi"
    mysql -u root -e "SELECT 1;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Şifresiz root erişimi çalışıyor"
        echo "⚠️  Application.properties'de şifreyi boş bırak"
    else
        echo "❌ Hiçbir yöntem çalışmıyor"
    fi
fi

echo ""
echo "==============================="
echo "🏁 MySQL Şifre Düzeltme Tamamlandı!"
echo "==============================="

echo ""
echo "📊 SONUÇ:"
echo "- Root şifresi: Hilton5252."
echo "- Veritabanı: smart_site_management"
echo "- Şimdi backend'i yeniden başlat!"