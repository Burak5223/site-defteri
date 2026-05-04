#!/bin/bash

echo "🚀 Backend Hızlı Başlatma"
echo "========================"

# MySQL servisini kontrol et ve başlat
echo "📊 MySQL servisi kontrol ediliyor..."
if ! systemctl is-active --quiet mysql; then
    echo "🔄 MySQL başlatılıyor..."
    sudo systemctl start mysql
    sleep 3
fi

# MySQL durumunu kontrol et
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL çalışıyor"
else
    echo "❌ MySQL başlatılamadı!"
    exit 1
fi

# Backend dizinine git
echo "📁 Backend dizinine geçiliyor..."
cd ~/BACKEND_NEW/site

# JAR dosyası var mı kontrol et
if [ ! -f "target/site-backend-1.0.0.jar" ]; then
    echo "⚠️ JAR dosyası bulunamadı, Maven ile build yapılıyor..."
    mvn clean package -DskipTests
fi

# Backend'i başlat
echo "🔥 Backend başlatılıyor..."
echo "📡 Backend URL: http://172.29.1.55:8080"
echo "🔗 Test URL: http://172.29.1.55:8080/api/test"
echo ""
echo "⏹️ Durdurmak için Ctrl+C kullan"
echo ""

java -jar target/site-backend-1.0.0.jar --server.port=8080