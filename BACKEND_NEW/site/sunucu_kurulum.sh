#!/bin/bash
# Sunucuda Backend Kurulum Scripti
# Kullanım: bash sunucu_kurulum.sh

set -e

echo "🚀 Backend Kurulum Başlıyor..."
echo "================================"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 1. Sistem güncellemesi
echo -e "\n${YELLOW}📦 Sistem güncelleniyor...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Temel araçları kur
echo -e "\n${YELLOW}🔧 Temel araçlar kuruluyor...${NC}"
sudo apt install -y curl wget git nano net-tools

# 3. Docker kurulumu
if ! command -v docker &> /dev/null; then
    echo -e "\n${YELLOW}🐳 Docker kuruluyor...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker kuruldu${NC}"
else
    echo -e "${GREEN}✅ Docker zaten kurulu${NC}"
fi

# 4. Docker Compose kurulumu
if ! command -v docker-compose &> /dev/null; then
    echo -e "\n${YELLOW}🐳 Docker Compose kuruluyor...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose kuruldu${NC}"
else
    echo -e "${GREEN}✅ Docker Compose zaten kurulu${NC}"
fi

# 5. Proje dizinini oluştur
PROJECT_DIR="/opt/site-backend"
echo -e "\n${YELLOW}📁 Proje dizini oluşturuluyor: $PROJECT_DIR${NC}"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# 6. .env dosyası kontrolü
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}📝 .env dosyası oluşturuluyor...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env dosyası oluşturuldu (.env.example'dan)${NC}"
        echo -e "${CYAN}⚠️  Lütfen .env dosyasını düzenleyin: nano .env${NC}"
    else
        cat > .env << 'EOF'
# Database
DB_ROOT_PASSWORD=GüçlüŞifre123!
DB_USER=siteuser
DB_PASSWORD=GüçlüŞifre456!

# Server
PORT=8080

# JWT
JWT_SECRET=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437

# Telegram
TELEGRAM_BOT_TOKEN=8515377926:AAHlv_RCqEuKg_A-ULY7QLoC_zUfuvKKSmM
TELEGRAM_BOT_USERNAME=sakin_onay_bot

# Gemini AI
GEMINI_API_KEY=AIzaSyAJW7oFkPPFKSlE7wmEyz31OoaKWyveqFs
AI_CARGO_ENABLED=true
EOF
        echo -e "${GREEN}✅ .env dosyası oluşturuldu${NC}"
        echo -e "${CYAN}⚠️  Lütfen .env dosyasını düzenleyin: nano .env${NC}"
    fi
else
    echo -e "${GREEN}✅ .env dosyası mevcut${NC}"
fi

# 7. Firewall ayarları
echo -e "\n${YELLOW}🔥 Firewall ayarları yapılıyor...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 8080/tcp
    sudo ufw allow 22/tcp
    echo -e "${GREEN}✅ UFW kuralları eklendi${NC}"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=8080/tcp
    sudo firewall-cmd --permanent --add-port=22/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✅ Firewalld kuralları eklendi${NC}"
else
    echo -e "${YELLOW}⚠️  Firewall bulunamadı, manuel ayarlama gerekebilir${NC}"
fi

# 8. Dizin yapısını oluştur
echo -e "\n${YELLOW}📂 Dizin yapısı oluşturuluyor...${NC}"
mkdir -p logs uploads

# 9. Docker Compose dosyası kontrolü
if [ ! -f docker-compose.yml ]; then
    echo -e "${RED}❌ docker-compose.yml bulunamadı!${NC}"
    echo -e "${YELLOW}Lütfen docker-compose.yml dosyasını bu dizine kopyalayın.${NC}"
    exit 1
fi

# 10. Dockerfile kontrolü
if [ ! -f Dockerfile ]; then
    echo -e "${RED}❌ Dockerfile bulunamadı!${NC}"
    echo -e "${YELLOW}Lütfen Dockerfile dosyasını bu dizine kopyalayın.${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Kurulum tamamlandı!${NC}"
echo -e "\n${CYAN}📋 Sonraki adımlar:${NC}"
echo -e "1. ${YELLOW}.env dosyasını düzenle:${NC} nano .env"
echo -e "2. ${YELLOW}Veritabanını import et:${NC} docker-compose exec mysql mysql -u root -p < backup.sql"
echo -e "3. ${YELLOW}Backend'i başlat:${NC} docker-compose up -d --build"
echo -e "4. ${YELLOW}Logları izle:${NC} docker-compose logs -f backend"
echo -e "5. ${YELLOW}Durumu kontrol et:${NC} docker-compose ps"
echo -e "\n${CYAN}🌐 Backend erişim:${NC} http://$(hostname -I | awk '{print $1}'):8080"
echo -e "\n${GREEN}🎉 Başarılar!${NC}"
