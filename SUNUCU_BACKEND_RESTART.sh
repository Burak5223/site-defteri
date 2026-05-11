#!/bin/bash

echo "🔄 Backend Restart Script"
echo "========================"

# Backend'i kapat
echo "🛑 Eski backend process'ini kapatıyor..."
pkill -f "java.*site-backend" 2>/dev/null || echo "   Çalışan backend bulunamadı"

# Port 8080'i temizle
echo "🧹 Port 8080'i temizliyor..."
sudo lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "   Port zaten boş"

# Biraz bekle
sleep 2

# BACKEND_NEW/site klasörüne git
cd ~/BACKEND_NEW/site || { echo "❌ BACKEND_NEW/site klasörü bulunamadı!"; exit 1; }

# Logs klasörü oluştur
mkdir -p logs

# Yeni backend başlat
echo "🚀 Yeni backend başlatılıyor..."
nohup java -Dserver.address=0.0.0.0 -jar target/site-backend-1.0.0.jar > logs/backend.log 2>&1 &

# Biraz bekle
sleep 3

# Kontrol et
echo "🔍 Backend durumu kontrol ediliyor..."
if ps aux | grep -q "[j]ava.*site-backend"; then
    echo "✅ Backend başarıyla başlatıldı!"
    
    # Port kontrolü
    if ss -tlnp | grep -q ":8080"; then
        echo "✅ Port 8080 dinleniyor"
        
        # HTTP test
        echo "🌐 HTTP testi yapılıyor..."
        sleep 2
        if curl -s http://localhost:8080/api/test > /dev/null; then
            echo "✅ Backend HTTP testini geçti!"
            echo "🎉 Backend tamamen hazır!"
        else
            echo "⚠️  Backend başladı ama HTTP yanıt vermiyor (henüz hazır olmayabilir)"
        fi
    else
        echo "❌ Port 8080 dinlenmiyor"
    fi
else
    echo "❌ Backend başlatılamadı!"
    echo "📋 Son log kayıtları:"
    tail -10 logs/backend.log 2>/dev/null || echo "Log dosyası bulunamadı"
fi

echo ""
echo "📊 Mevcut Java process'leri:"
ps aux | grep java | grep -v grep

echo ""
echo "🔗 Backend URL: http://172.29.1.55:8080"
echo "🧪 Test URL: curl http://localhost:8080/api/test"