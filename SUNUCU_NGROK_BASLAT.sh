#!/bin/bash
# Ngrok ile Backend'i İnternete Aç
# Sunucuda çalıştır

echo "=== NGROK KURULUM VE BAŞLATMA ==="

# 1. Ngrok kurulu mu kontrol et
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok kurulu değil. Kuruluyor..."
    
    # Ngrok'u indir ve kur
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
        sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
        sudo tee /etc/apt/sources.list.d/ngrok.list && \
        sudo apt update && sudo apt install ngrok
    
    echo "✓ Ngrok kuruldu!"
else
    echo "✓ Ngrok zaten kurulu"
fi

# 2. Backend'in çalıştığını kontrol et
if ss -tlnp | grep -q ":8080"; then
    echo "✓ Backend port 8080'de çalışıyor"
else
    echo "❌ Backend çalışmıyor! Önce backend'i başlat."
    exit 1
fi

# 3. Ngrok'u başlat
echo ""
echo "=== NGROK BAŞLATILIYOR ==="
echo "Port 8080'i internete açıyorum..."
echo ""
echo "⚠️  ÖNEMLI: Ngrok URL'ini kopyala ve mobil app'e yapıştır!"
echo ""

# Ngrok'u başlat (HTTP için)
ngrok http 8080
