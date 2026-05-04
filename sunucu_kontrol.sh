#!/bin/bash

echo "🔍 Backend durumu kontrol ediliyor..."

# 1. Java process kontrolü
echo "1. Java process kontrolü:"
ps aux | grep java | grep -v grep

echo -e "\n2. Port 8080 kontrolü:"
netstat -tlnp | grep :8080

echo -e "\n3. Docker container kontrolü:"
docker ps | grep backend

echo -e "\n4. Backend log kontrolü (son 20 satır):"
if [ -f ~/BACKEND_NEW/site/logs/application.log ]; then
    tail -20 ~/BACKEND_NEW/site/logs/application.log
else
    echo "Log dosyası bulunamadı"
fi

echo -e "\n5. Backend dizin kontrolü:"
ls -la ~/BACKEND_NEW/site/

echo -e "\n6. Localhost test:"
curl -s http://localhost:8080/api/auth/test || echo "Localhost bağlantısı başarısız"

echo -e "\n7. IP test:"
curl -s http://172.29.1.55:8080/api/auth/test || echo "IP bağlantısı başarısız"