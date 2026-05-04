#!/bin/bash

echo "=========================================="
echo "BACKEND_NEW Docker Deployment (FIXED)"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. unrar-free kurulumu (Debian'da unrar yerine)
echo -e "${YELLOW}[1/8] unrar-free kuruluyor...${NC}"
apt update -qq && apt install unrar-free -y -qq
echo -e "${GREEN}✓ unrar-free kuruldu${NC}"
echo ""

# 2. Docker Compose Plugin kurulumu
echo -e "${YELLOW}[2/8] Docker Compose plugin kuruluyor...${NC}"
apt install docker-compose-plugin -y -qq
echo -e "${GREEN}✓ Docker Compose kuruldu${NC}"
echo ""

# 3. RAR dosyasını kontrol et
echo -e "${YELLOW}[3/8] RAR dosyası kontrol ediliyor...${NC}"
if [ ! -f "/root/BACKEND_NEW.rar" ]; then
    echo -e "${RED}HATA: /root/BACKEND_NEW.rar bulunamadı!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ RAR dosyası bulundu${NC}"
echo ""

# 4. Database backup kontrol
echo -e "${YELLOW}[4/8] Database backup kontrol ediliyor...${NC}"
if [ ! -f "/root/smart_site_management.sql" ]; then
    echo -e "${RED}HATA: /root/smart_site_management.sql bulunamadı!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database backup bulundu${NC}"
echo ""

# 5. RAR dosyasını aç
echo -e "${YELLOW}[5/8] BACKEND_NEW.rar açılıyor...${NC}"
cd /root
rm -rf BACKEND_NEW
unrar x -o+ BACKEND_NEW.rar
echo -e "${GREEN}✓ RAR dosyası açıldı${NC}"
echo ""

# 6. Docker container'ları başlat
echo -e "${YELLOW}[6/8] Docker container'ları başlatılıyor...${NC}"
cd /root/BACKEND_NEW/site
docker compose up -d
echo -e "${GREEN}✓ Container'lar başlatıldı${NC}"
echo ""

# 7. MySQL'in hazır olmasını bekle
echo -e "${YELLOW}[7/8] MySQL'in hazır olması bekleniyor (30 saniye)...${NC}"
sleep 30
echo -e "${GREEN}✓ MySQL hazır${NC}"
echo ""

# 8. Database'i import et
echo -e "${YELLOW}[8/8] Database import ediliyor...${NC}"
docker cp /root/smart_site_management.sql site_mysql:/tmp/backup.sql
docker compose exec -T mysql mysql -uroot -pHilton5252. smart_site_management < /root/smart_site_management.sql
echo -e "${GREEN}✓ Database import edildi${NC}"
echo ""

# Sonuç
echo "=========================================="
echo -e "${GREEN}DEPLOYMENT TAMAMLANDI!${NC}"
echo "=========================================="
echo ""
echo "Container durumunu kontrol et:"
echo "  cd /root/BACKEND_NEW/site"
echo "  docker compose ps"
echo ""
echo "Backend loglarını izle:"
echo "  docker compose logs -f backend"
echo ""
echo "Backend URL: http://172.29.1.55:8080"
echo "MySQL Port: 3306"
echo ""
