#!/bin/bash

echo "🗄️ Veritabanı Bağlantı Kontrolü"
echo "==============================="

# MySQL bağlantı bilgileri (application.properties'den)
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="smart_site_management"
DB_USER="root"
DB_PASS="Hilton5252."

echo "🔍 Test 1: MySQL Servisi Çalışıyor mu?"
if command -v mysql &> /dev/null; then
    echo "✅ MySQL client mevcut"
else
    echo "❌ MySQL client bulunamadı"
fi

# Port kontrolü
echo ""
echo "🔍 Test 2: MySQL Port Kontrolü"
if netstat -tlnp 2>/dev/null | grep ":3306 " > /dev/null; then
    echo "✅ Port 3306 dinleniyor"
    netstat -tlnp 2>/dev/null | grep ":3306 "
else
    echo "❌ Port 3306 dinlenmiyor - MySQL çalışmıyor olabilir"
fi

echo ""
echo "🔍 Test 3: MySQL Process Kontrolü"
mysql_process=$(ps aux | grep mysql | grep -v grep)
if [ -n "$mysql_process" ]; then
    echo "✅ MySQL process çalışıyor"
    echo "$mysql_process"
else
    echo "❌ MySQL process bulunamadı"
fi

echo ""
echo "🔍 Test 4: Veritabanı Bağlantı Testi"
if command -v mysql &> /dev/null; then
    # MySQL bağlantısını test et
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Veritabanı bağlantısı başarılı"
        
        echo ""
        echo "🔍 Test 5: Veritabanı Varlık Kontrolü"
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SHOW DATABASES;" 2>/dev/null | grep "$DB_NAME"
        if [ $? -eq 0 ]; then
            echo "✅ '$DB_NAME' veritabanı mevcut"
            
            echo ""
            echo "🔍 Test 6: Tablo Kontrolü"
            tables=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null)
            if [ $? -eq 0 ]; then
                echo "✅ Tablolar listelendi:"
                echo "$tables"
                
                # Users tablosu var mı kontrol et
                user_table=$(echo "$tables" | grep -i "users")
                if [ -n "$user_table" ]; then
                    echo "✅ Users tablosu mevcut"
                else
                    echo "❌ Users tablosu bulunamadı - Bu auth sorununun nedeni!"
                fi
            else
                echo "❌ Tablolar listelenemedi"
            fi
        else
            echo "❌ '$DB_NAME' veritabanı bulunamadı"
        fi
    else
        echo "❌ Veritabanı bağlantısı başarısız"
        echo "Bağlantı bilgileri:"
        echo "Host: $DB_HOST"
        echo "Port: $DB_PORT"
        echo "Database: $DB_NAME"
        echo "User: $DB_USER"
    fi
else
    echo "❌ MySQL client yok, bağlantı test edilemiyor"
fi

echo ""
echo "==============================="
echo "🏁 Veritabanı Kontrol Tamamlandı!"
echo "==============================="

echo ""
echo "📊 SONUÇ:"
echo "- MySQL servisi çalışıyor mu?"
echo "- Port 3306 açık mı?"
echo "- Veritabanı bağlantısı çalışıyor mu?"
echo "- Gerekli tablolar mevcut mu?"