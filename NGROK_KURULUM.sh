#!/bin/bash

echo "🚀 ngrok Kurulum ve Başlatma Scripti"
echo "=================================="

# ngrok kurulumu kontrol et
if ! command -v ngrok &> /dev/null; then
    echo "📦 ngrok kuruluyor..."
    
    # Snap ile kurulum dene
    if command -v snap &> /dev/null; then
        echo "   Snap ile kuruluyor..."
        sudo snap install ngrok
    else
        # Manuel kurulum
        echo "   Manuel kurulum yapılıyor..."
        cd /tmp
        wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
        tar xvzf ngrok-v3-stable-linux-amd64.tgz
        sudo mv ngrok /usr/local/bin
        cd -
    fi
else
    echo "✅ ngrok zaten kurulu"
fi

# Backend çalışıyor mu kontrol et
echo ""
echo "🔍 Backend durumu kontrol ediliyor..."
if curl -s http://localhost:8080/api/test > /dev/null; then
    echo "✅ Backend çalışıyor"
    
    echo ""
    echo "🌐 ngrok başlatılıyor..."
    echo "⚠️  Bu komut çalışmaya devam edecek. Yeni terminal açıp URL'yi kopyala!"
    echo ""
    
    # ngrok başlat
    ngrok http 8080
else
    echo "❌ Backend çalışmıyor! Önce backend'i başlat:"
    echo "   cd ~/BACKEND_NEW/site"
    echo "   nohup java -Dserver.address=0.0.0.0 -jar target/site-backend-1.0.0.jar > logs/backend.log 2>&1 &"
fi