#!/bin/bash

echo "🔥 Port 8080 firewall'da açılıyor..."

# UFW varsa kullan
if command -v ufw &> /dev/null; then
    echo "UFW kullanılıyor..."
    sudo ufw allow 8080/tcp
    sudo ufw status
else
    echo "UFW bulunamadı, iptables kullanılıyor..."
    # iptables ile port aç
    sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
    sudo iptables -I OUTPUT -p tcp --sport 8080 -j ACCEPT
    
    # Kalıcı hale getir (Ubuntu/Debian)
    if command -v iptables-save &> /dev/null; then
        sudo iptables-save > /etc/iptables/rules.v4 2>/dev/null || echo "iptables kuralları kaydedilemedi"
    fi
fi

echo "✅ Port 8080 açıldı!"

# Test et
echo "Port test ediliyor..."
netstat -tlnp | grep :8080