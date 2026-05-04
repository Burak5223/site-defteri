#!/bin/bash

echo "🚀 Backend Arkaplan Başlatma"
echo "============================"

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

# Eski backend process'ini durdur
echo "🔄 Eski backend process'leri kontrol ediliyor..."
pkill -f "site-backend-1.0.0.jar" 2>/dev/null || true
sleep 2

# Backend'i arkaplanda başlat
echo "🔥 Backend arkaplanda başlatılıyor..."
nohup java -jar target/site-backend-1.0.0.jar --server.port=8080 > backend.log 2>&1 &
BACKEND_PID=$!

sleep 5

# Process çalışıyor mu kontrol et
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend başarıyla başlatıldı!"
    echo "📊 Process ID: $BACKEND_PID"
    echo "📡 Backend URL: http://172.29.1.55:8080"
    echo "🔗 Test URL: http://172.29.1.55:8080/api/test"
    echo "📄 Log dosyası: ~/BACKEND_NEW/site/backend.log"
    echo ""
    echo "📋 Durumu kontrol etmek için:"
    echo "   tail -f ~/BACKEND_NEW/site/backend.log"
    echo ""
    echo "⏹️ Durdurmak için:"
    echo "   pkill -f site-backend-1.0.0.jar"
else
    echo "❌ Backend başlatılamadı!"
    echo "📄 Log kontrol et: cat ~/BACKEND_NEW/site/backend.log"
    exit 1
fi