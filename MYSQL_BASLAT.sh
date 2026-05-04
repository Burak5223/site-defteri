#!/bin/bash

echo "🗄️ MySQL Başlatma Scripti"
echo "========================="

echo "🔍 Adım 1: MySQL Durumu Kontrol"
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL zaten çalışıyor"
else
    echo "❌ MySQL çalışmıyor, başlatılıyor..."
    
    echo ""
    echo "🔍 Adım 2: MySQL Servisi Başlatma"
    sudo systemctl start mysql
    
    if [ $? -eq 0 ]; then
        echo "✅ MySQL başlatma komutu çalıştırıldı"
    else
        echo "❌ MySQL başlatılamadı, alternatif yöntem deneniyor..."
        
        # Alternatif başlatma yöntemi
        sudo service mysql start
        
        if [ $? -eq 0 ]; then
            echo "✅ MySQL alternatif yöntemle başlatıldı"
        else
            echo "❌ MySQL başlatılamadı"
        fi
    fi
fi

echo ""
echo "🔍 Adım 3: MySQL Durumu Tekrar Kontrol"
sleep 3

# Process kontrolü
mysql_process=$(ps aux | grep mysql | grep -v grep)
if [ -n "$mysql_process" ]; then
    echo "✅ MySQL process çalışıyor"
else
    echo "❌ MySQL process hala çalışmıyor"
fi

# Port kontrolü
if netstat -tlnp 2>/dev/null | grep ":3306 " > /dev/null; then
    echo "✅ Port 3306 dinleniyor"
else
    echo "❌ Port 3306 hala dinlenmiyor"
fi

echo ""
echo "🔍 Adım 4: Veritabanı Bağlantı Testi"
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASS="Hilton5252."

mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Veritabanı bağlantısı başarılı"
    
    echo ""
    echo "🔍 Adım 5: Veritabanı Oluşturma"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS smart_site_management;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Veritabanı 'smart_site_management' hazır"
    else
        echo "❌ Veritabanı oluşturulamadı"
    fi
else
    echo "❌ Veritabanı bağlantısı hala başarısız"
fi

echo ""
echo "========================="
echo "🏁 MySQL Başlatma Tamamlandı!"
echo "========================="

echo ""
echo "📊 SONUÇ:"
echo "- MySQL servisi çalışıyor mu?"
echo "- Port 3306 açık mı?"
echo "- Veritabanı bağlantısı çalışıyor mu?"
echo ""
echo "💡 Şimdi backend'i yeniden başlatabilirsin!"
echo "💡 Sonra auth testlerini tekrar çalıştır."