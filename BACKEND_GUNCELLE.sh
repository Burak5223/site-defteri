#!/bin/bash

echo "🔄 Backend Güncelleme Başlıyor..."
echo "================================"

# Backend dizinine git
cd ~/BACKEND_NEW/site

echo "📋 Adım 1: Eski Backend'i Durdur"
pkill -f site-backend-1.0.0.jar
sleep 3

echo "📋 Adım 2: Yeni Kodu Build Et"
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "✅ Build başarılı!"
else
    echo "❌ Build başarısız!"
    exit 1
fi

echo "📋 Adım 3: MySQL Çalışıyor mu Kontrol Et"
if ! systemctl is-active --quiet mysql; then
    echo "🔄 MySQL başlatılıyor..."
    sudo systemctl start mysql
    sleep 3
fi

echo "📋 Adım 4: Yeni Backend'i Başlat"
nohup java -jar target/site-backend-1.0.0.jar --server.port=8080 > backend.log 2>&1 &
BACKEND_PID=$!

sleep 5

# Process çalışıyor mu kontrol et
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend başarıyla güncellendi ve başlatıldı!"
    echo "📊 Process ID: $BACKEND_PID"
    echo "📡 Backend URL: http://172.29.1.55:8080"
    echo "🔗 Test URL: http://172.29.1.55:8080/api/test"
    echo "📄 Log dosyası: ~/BACKEND_NEW/site/backend.log"
    echo ""
    echo "📋 Log'ları görmek için:"
    echo "   tail -f ~/BACKEND_NEW/site/backend.log"
else
    echo "❌ Backend başlatılamadı!"
    echo "📄 Log kontrol et: cat ~/BACKEND_NEW/site/backend.log"
    exit 1
fi

echo ""
echo "📋 Adım 5: API Test"
sleep 3
response=$(curl -s -w "HTTP_CODE:%{http_code}" "http://172.29.1.55:8080/api/test")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)

if [ "$http_code" = "200" ]; then
    echo "✅ API çalışıyor - HTTP $http_code"
else
    echo "⚠️ API henüz hazır değil - HTTP $http_code"
    echo "📄 Birkaç saniye bekle ve tekrar dene"
fi

echo ""
echo "================================"
echo "🏁 Backend Güncelleme Tamamlandı!"
echo "================================"