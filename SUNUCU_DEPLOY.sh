#!/bin/bash

# 🚀 Sunucu Git Deploy Script
# Bu script sunucuda çalıştırılacak

set -e  # Hata durumunda dur

echo "🚀 Git Deploy başlatılıyor..."

# Proje dizinine git
PROJECT_DIR="/root/BACKEND_NEW/site"
cd "$PROJECT_DIR" || exit 1

echo "📍 Çalışma dizini: $(pwd)"

# Git kurulu mu kontrol et
if ! command -v git &> /dev/null; then
    echo "❌ Git kurulu değil! Yükleniyor..."
    apt update && apt install -y git
fi

# Git repository başlatılmış mı kontrol et
if [ ! -d ".git" ]; then
    echo "⚠️  Git repository bulunamadı! İlk kurulum yapılıyor..."
    git init
    git remote add origin https://github.com/Burak5223/site-defteri.git
    git fetch origin
    git checkout -b main origin/main
    echo "✅ Git repository başarıyla kuruldu!"
fi

# Mevcut değişiklikleri kaydet (varsa)
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Yerel değişiklikler tespit edildi, yedekleniyor..."
    git stash save "Auto-stash before deploy $(date +%Y%m%d_%H%M%S)"
fi

# GitHub'dan son değişiklikleri çek
echo "📥 GitHub'dan son değişiklikler çekiliyor..."
git fetch origin main
git reset --hard origin/main

# Eğer stash varsa geri yükle
if git stash list | grep -q "stash@{0}"; then
    echo "📦 Yerel değişiklikler geri yükleniyor..."
    git stash pop || echo "⚠️  Stash uygulanamadı, devam ediliyor..."
fi

# Maven kurulu mu kontrol et
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven kurulu değil!"
    echo "Maven kurulumu için: apt update && apt install -y maven"
    exit 1
fi

# Log dizini oluştur
mkdir -p logs

# Maven build
echo "🔨 Maven build başlatılıyor..."
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "✅ Build başarılı!"
    
    # Backend'i yeniden başlat
    echo "🔄 Backend yeniden başlatılıyor..."
    
    # Eski process'i durdur
    echo "⏹️  Eski backend process durduruluyor..."
    pkill -f "site-backend-1.0.0.jar" || echo "⚠️  Çalışan process bulunamadı"
    sleep 3
    
    # JAR dosyası var mı kontrol et
    if [ ! -f "target/site-backend-1.0.0.jar" ]; then
        echo "❌ JAR dosyası bulunamadı!"
        exit 1
    fi
    
    # Yeni JAR'ı başlat
    echo "▶️  Yeni backend başlatılıyor..."
    nohup java -Dserver.address=0.0.0.0 -jar target/site-backend-1.0.0.jar > logs/backend.log 2>&1 &
    
    # Process ID'yi kaydet
    echo $! > logs/backend.pid
    
    # Başlatma kontrolü
    sleep 5
    if ps -p $(cat logs/backend.pid) > /dev/null; then
        echo ""
        echo "✅ Backend başarıyla yeniden başlatıldı!"
        echo "📋 Process ID: $(cat logs/backend.pid)"
        echo "📋 Log dosyası: $PROJECT_DIR/logs/backend.log"
        echo ""
        echo "📊 Komutlar:"
        echo "   Log izle: tail -f $PROJECT_DIR/logs/backend.log"
        echo "   Durdur:   kill \$(cat $PROJECT_DIR/logs/backend.pid)"
        echo "   Test:     curl http://localhost:8080/api/test"
        echo ""
        
        # Backend test
        echo "🧪 Backend testi yapılıyor..."
        sleep 2
        if curl -s http://localhost:8080/api/test > /dev/null; then
            echo "✅ Backend çalışıyor ve erişilebilir!"
        else
            echo "⚠️  Backend henüz hazır değil, birkaç saniye bekleyin"
        fi
    else
        echo "❌ Backend başlatılamadı! Log kontrol edin:"
        echo "   tail -f $PROJECT_DIR/logs/backend.log"
        exit 1
    fi
else
    echo "❌ Build başarısız!"
    exit 1
fi