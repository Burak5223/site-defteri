#!/bin/bash
# Script dosyalarına çalıştırma izni verme
# Kullanım: bash izin_ver.sh

echo "🔐 Script dosyalarına çalıştırma izni veriliyor..."

chmod +x baslat.sh
chmod +x durdur.sh
chmod +x yedek_al.sh
chmod +x sunucu_kurulum.sh
chmod +x izin_ver.sh

echo "✅ İzinler verildi!"
echo ""
echo "📋 Kullanılabilir scriptler:"
echo "  ./baslat.sh           - Backend'i başlat"
echo "  ./durdur.sh           - Backend'i durdur"
echo "  ./yedek_al.sh         - Veritabanı yedeği al"
echo "  ./sunucu_kurulum.sh   - İlk kurulum (sadece bir kez)"
