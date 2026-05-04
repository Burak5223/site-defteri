#!/bin/bash

echo "=========================================="
echo "BACKEND_NEW Docker Deployment Script (ZIP)"
echo "=========================================="
echo ""

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. ZIP dosyasını kontrol et
echo -e "${YELLOW}[1/7] ZIP dosyası kontrol ediliyor...${NC}"
if [ ! -f "/root/BACKEND_NEW.zip" ]; then
    echo -e "${RED}HATA: /root/BACKEND_NEW.zip bulunamadı!${NC}"
    echo "Lütfen önce BACKEND_NEW.zip dosyasını /root/ klasörüne yükleyin."
    exit 1
fi
echo -e "${GREEN}✓ ZIP dosyası bulundu${NC}"
echo ""

# 2. Database backup dosyasını kontrol et
echo -e "${YELLOW}[2/7] Database backup kontrol ediliyor...${NC}"
if [ ! -f "/root/smart_site_management.sql" ]; then
    echo -e "${RED}HATA: /root/smart_site_management.sql bulunamadı!${NC}"
    echo "Lütfen önce smart_site_management.sql dosyasını /root/ klasörüne yükleyin."
    exit 1
fi
echo -e "${GREEN}✓ Database backup bulundu${NC}"
echo ""

# 3. unzip kurulumu
echo -e "${YELLOW}[3/7] unzip kuruluyor...${NC}"
apt update -qq && apt install unzip -y -qq
echo -e "${GREEN}✓ unzip kuruldu${NC}"
echo ""

# 4. ZIP dosyasını aç
echo -e "${YELLOW}[4/7] BACKEND_NEW.zip açılıyor...${NC}"
cd /root
unzip -o BACKEND_NEW.zip
echo -e "${GREEN}✓ ZIP dosyası açıldı${NC}"
echo ""

# 5. Docker container'ları başlat
echo -e "${YELLOW}[5/7] Docker container'ları başlatılıyor...${NC}"
cd /root/BACKEND_NEW/site
docker-compose up -d
echo -e "${GREEN}✓ Container'lar başlatıldı${NC}"
echo ""

# 6. MySQL'in hazır olmasını bekle
echo -e "${YELLOW}[6/7] MySQL'in hazır olması bekleniyor (30 saniye)...${NC}"
sleep 30
echo -e "${GREEN}✓ MySQL hazır${NC}"
echo ""

# 7. Database'i import et
echo -e "${YELLOW}[7/7] Database import ediliyor...${NC}"
docker cp /root/smart_site_management.sql site_mysql:/tmp/backup.sql
docker-compose exec -T mysql mysql -uroot -pHilton5252. smart_site_management < /root/smart_site_management.sql
echo -e "${GREEN}✓ Database import edildi${NC}"
echo ""

# Sonuç
echo "=========================================="
echo -e "${GREEN}DEPLOYMENT TAMAMLANDI!${NC}"
echo "=========================================="
echo ""
echo "Container durumunu kontrol et:"
echo "  docker-compose ps"
echo ""
echo "Backend loglarını izle:"
echo "  docker-compose logs -f backend"
echo ""
echo "MySQL loglarını izle:"
echo "  docker-compose logs -f mysql"
echo ""
echo "Tüm logları izle:"
echo "  docker-compose logs -f"
echo ""
echo "Backend URL: http://172.29.1.55:8080"
echo "MySQL Port: 3306"
echo ""
