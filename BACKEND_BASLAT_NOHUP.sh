#!/bin/bash

echo "🚀 Backend başlatılıyor (nohup ile)..."

# Backend dizinine git
cd ~/BACKEND_NEW/site/

# Önce mevcut backend'i durdur
echo "1. Mevcut backend durduriliyor..."
pkill -f "java.*site-backend" || echo "Çalışan backend bulunamadı"

# Docker container'ları durdur
echo "2. Docker container'ları durduriliyor..."
docker-compose down 2>/dev/null || echo "Docker compose bulunamadı"

# Maven ile build et
echo "3. Maven build başlatılıyor..."
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "✅ Build başarılı!"
    
    # JAR dosyasını kontrol et
    if [ -f target/site-backend-1.0.0.jar ]; then
        echo "4. Backend başlatılıyor (nohup ile)..."
        
        # Logs dizinini oluştur
        mkdir -p logs
        
        # Backend'i nohup ile başlat (tüm IP'lerde dinle)
        nohup java -Dserver.address=0.0.0.0 -jar target/site-backend-1.0.0.jar > logs/backend.log 2>&1 &
        
        echo "Backend PID: $!"
        echo "✅ Backend nohup ile başlatıldı!"
        
        # 5 saniye bekle ve durumu kontrol et
        sleep 5
        
        echo "5. Backend durumu kontrol ediliyor..."
        ps aux | grep java | grep site-backend | grep -v grep
        
        echo "6. Port kontrolü..."
        netstat -tlnp | grep :8080
        
        echo "7. Log kontrolü (son 10 satır)..."
        tail -10 logs/backend.log
        
    else
        echo "❌ JAR dosyası bulunamadı!"
        exit 1
    fi
else
    echo "❌ Build başarısız!"
    exit 1
fi