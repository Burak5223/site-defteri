#!/bin/bash
# Backend Başlatma Scripti
# Kullanım: bash baslat.sh

set -e

echo "🚀 Backend Başlatılıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Docker kontrolü
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker kurulu değil!${NC}"
    echo -e "${YELLOW}Kurulum için: bash sunucu_kurulum.sh${NC}"
    exit 1
fi

# Docker Compose kontrolü
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose kurulu değil!${NC}"
    echo -e "${YELLOW}Kurulum için: bash sunucu_kurulum.sh${NC}"
    exit 1
fi

# .env kontrolü
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, .env.example'dan oluşturuluyor...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env dosyası oluşturuldu${NC}"
        echo -e "${CYAN}Lütfen .env dosyasını düzenleyin: nano .env${NC}"
        read -p "Devam etmek için Enter'a basın..."
    else
        echo -e "${RED}❌ .env.example dosyası da bulunamadı!${NC}"
        exit 1
    fi
fi

# Eski container'ları durdur
echo -e "\n${YELLOW}🛑 Eski container'lar durduruluyor...${NC}"
docker-compose down 2>/dev/null || true

# Yeni container'ları başlat
echo -e "\n${YELLOW}🚀 Container'lar başlatılıyor...${NC}"
docker-compose up -d --build

# Başlatma durumunu kontrol et
echo -e "\n${YELLOW}⏳ Container'ların başlaması bekleniyor...${NC}"
sleep 5

# Durum kontrolü
echo -e "\n${CYAN}📊 Container Durumu:${NC}"
docker-compose ps

# Backend loglarını göster
echo -e "\n${CYAN}📋 Backend Logları (Son 30 satır):${NC}"
docker-compose logs --tail=30 backend

# Sağlık kontrolü
echo -e "\n${YELLOW}🏥 Sağlık kontrolü yapılıyor...${NC}"
sleep 10

if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend başarıyla başlatıldı!${NC}"
else
    echo -e "${YELLOW}⚠️  Backend henüz hazır değil, birkaç saniye daha bekleyin...${NC}"
fi

# IP adresini al
IP=$(hostname -I | awk '{print $1}')

echo -e "\n${GREEN}🎉 İşlem tamamlandı!${NC}"
echo -e "\n${CYAN}📋 Kullanışlı Komutlar:${NC}"
echo -e "  ${YELLOW}Logları izle:${NC}        docker-compose logs -f backend"
echo -e "  ${YELLOW}Durumu kontrol et:${NC}   docker-compose ps"
echo -e "  ${YELLOW}Durdur:${NC}              docker-compose down"
echo -e "  ${YELLOW}Yeniden başlat:${NC}      docker-compose restart"
echo -e "  ${YELLOW}MySQL'e bağlan:${NC}      docker-compose exec mysql mysql -u root -p"
echo -e "\n${CYAN}🌐 Backend Erişim:${NC}"
echo -e "  ${GREEN}Local:${NC}  http://localhost:8080"
echo -e "  ${GREEN}Network:${NC} http://${IP}:8080"
