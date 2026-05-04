#!/bin/bash

echo "🚀 Backend başlatılıyor..."

# 1. Backend dizinine git
cd ~/BACKEND_NEW/site

# 2. MariaDB servisinin çalıştığını kontrol et
echo "📊 MariaDB servisi kontrol ediliyor..."
systemctl status mariadb --no-pager

# 3. Backend'i başlat
echo "🔥 Backend JAR dosyası başlatılıyor..."
java -jar target/site-backend-1.0.0.jar --server.port=8080

echo "✅ Backend başlatıldı!"