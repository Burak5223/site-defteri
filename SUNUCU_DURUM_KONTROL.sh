#!/bin/bash

echo "🔍 Sunucu Durum Kontrolü Başlatılıyor..."
echo "=================================="

# 1. Backend Process Kontrolü
echo "1️⃣ Backend Process Kontrolü:"
if ps aux | grep -q "site-backend-1.0.0.jar"; then
    echo "✅ Backend çalışıyor"
    ps aux | grep "site-backend-1.0.0.jar" | grep -v grep
else
    echo "❌ Backend çalışmıyor!"
fi
echo ""

# 2. Port Kontrolü
echo "2️⃣ Port 8080 Kontrolü:"
if ss -tlnp | grep -q ":8080"; then
    echo "✅ Port 8080 dinleniyor"
    ss -tlnp | grep ":8080"
else
    echo "❌ Port 8080 dinlenmiyor!"
fi
echo ""

# 3. Localhost Test
echo "3️⃣ Localhost Erişim Testi:"
if curl -s --connect-timeout 10 http://localhost:8080/api/test > /dev/null; then
    echo "✅ Localhost erişimi başarılı"
else
    echo "❌ Localhost erişimi başarısız!"
fi
echo ""

# 4. Sunucu IP Test
echo "4️⃣ Sunucu IP Erişim Testi:"
if curl -s --connect-timeout 10 http://172.29.1.55:8080/api/test > /dev/null; then
    echo "✅ Sunucu IP erişimi başarılı"
else
    echo "❌ Sunucu IP erişimi başarısız!"
fi
echo ""

# 5. MySQL Kontrolü
echo "5️⃣ MySQL Kontrolü:"
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL çalışıyor"
else
    echo "❌ MySQL çalışmıyor!"
fi
echo ""

# 6. Disk ve Memory
echo "6️⃣ Sistem Kaynakları:"
echo "Disk kullanımı:"
df -h | grep -E "(Filesystem|/dev/)"
echo ""
echo "Memory kullanımı:"
free -h
echo ""

# 7. Son Log Hatalar
echo "7️⃣ Son Backend Hataları:"
if [ -f "/root/BACKEND_NEW/site/logs/backend.log" ]; then
    echo "Son 10 log satırı:"
    tail -10 /root/BACKEND_NEW/site/logs/backend.log
    echo ""
    echo "Hata sayısı:"
    grep -i error /root/BACKEND_NEW/site/logs/backend.log | wc -l
else
    echo "❌ Log dosyası bulunamadı!"
fi

echo "=================================="
echo "🏁 Kontrol tamamlandı!"