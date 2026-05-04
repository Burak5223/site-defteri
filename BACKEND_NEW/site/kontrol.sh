#!/bin/bash
# Kurulum Kontrol Scripti
# Kullanım: bash kontrol.sh

echo "🔍 Backend Kurulum Kontrolü Başlıyor..."
echo "========================================"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# 1. Docker kontrolü
echo -e "\n📦 Docker Kontrolü..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker kurulu: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}❌ Docker kurulu değil!${NC}"
    echo -e "${YELLOW}   Kurulum: curl -fsSL https://get.docker.com | sh${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 2. Docker Compose kontrolü
echo -e "\n📦 Docker Compose Kontrolü..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✅ Docker Compose kurulu: $COMPOSE_VERSION${NC}"
else
    echo -e "${RED}❌ Docker Compose kurulu değil!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. Dosya kontrolü
echo -e "\n📁 Dosya Kontrolü..."

if [ -f "pom.xml" ]; then
    echo -e "${GREEN}✅ pom.xml mevcut${NC}"
else
    echo -e "${RED}❌ pom.xml bulunamadı!${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✅ Dockerfile mevcut${NC}"
else
    echo -e "${RED}❌ Dockerfile bulunamadı!${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✅ docker-compose.yml mevcut${NC}"
else
    echo -e "${RED}❌ docker-compose.yml bulunamadı!${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "src" ]; then
    echo -e "${GREEN}✅ src klasörü mevcut${NC}"
else
    echo -e "${RED}❌ src klasörü bulunamadı!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 4. .env kontrolü
echo -e "\n⚙️  .env Dosyası Kontrolü..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env dosyası mevcut${NC}"
    
    # Şifre kontrolü
    if grep -q "DB_ROOT_PASSWORD=Hilton5252." .env; then
        echo -e "${YELLOW}⚠️  DB_ROOT_PASSWORD varsayılan değerde! Değiştirmelisin.${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅ DB_ROOT_PASSWORD değiştirilmiş${NC}"
    fi
    
    if grep -q "DB_PASSWORD=Hilton5252." .env; then
        echo -e "${YELLOW}⚠️  DB_PASSWORD varsayılan değerde! Değiştirmelisin.${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅ DB_PASSWORD değiştirilmiş${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env dosyası yok, .env.example'dan oluşturulacak${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env dosyası oluşturuldu${NC}"
        echo -e "${YELLOW}⚠️  Lütfen .env dosyasını düzenle: nano .env${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}❌ .env.example de bulunamadı!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 5. Container kontrolü
echo -e "\n🐳 Container Kontrolü..."
if docker-compose ps &> /dev/null; then
    MYSQL_STATUS=$(docker-compose ps mysql 2>/dev/null | grep "Up" || echo "Down")
    BACKEND_STATUS=$(docker-compose ps backend 2>/dev/null | grep "Up" || echo "Down")
    
    if [[ $MYSQL_STATUS == *"Up"* ]]; then
        echo -e "${GREEN}✅ MySQL container çalışıyor${NC}"
    else
        echo -e "${YELLOW}⚠️  MySQL container çalışmıyor${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if [[ $BACKEND_STATUS == *"Up"* ]]; then
        echo -e "${GREEN}✅ Backend container çalışıyor${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend container çalışmıyor${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Container'lar henüz başlatılmamış${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 6. Port kontrolü
echo -e "\n🔌 Port Kontrolü..."
if netstat -tuln 2>/dev/null | grep -q ":8080 "; then
    echo -e "${GREEN}✅ Port 8080 kullanımda (Backend çalışıyor olabilir)${NC}"
elif ss -tuln 2>/dev/null | grep -q ":8080 "; then
    echo -e "${GREEN}✅ Port 8080 kullanımda (Backend çalışıyor olabilir)${NC}"
else
    echo -e "${YELLOW}⚠️  Port 8080 boş (Backend henüz başlatılmamış)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 7. Disk alanı kontrolü
echo -e "\n💾 Disk Alanı Kontrolü..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ Disk alanı yeterli (%$DISK_USAGE kullanımda)${NC}"
else
    echo -e "${YELLOW}⚠️  Disk alanı az (%$DISK_USAGE kullanımda)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 8. Bellek kontrolü
echo -e "\n🧠 Bellek Kontrolü..."
if command -v free &> /dev/null; then
    TOTAL_MEM=$(free -m | awk 'NR==2 {print $2}')
    if [ "$TOTAL_MEM" -gt 1500 ]; then
        echo -e "${GREEN}✅ Bellek yeterli (${TOTAL_MEM}MB)${NC}"
    else
        echo -e "${YELLOW}⚠️  Bellek az (${TOTAL_MEM}MB, minimum 2GB önerilen)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# 9. Veritabanı backup kontrolü
echo -e "\n💾 Veritabanı Backup Kontrolü..."
BACKUP_COUNT=$(ls /tmp/database_backup_*.sql 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Veritabanı backup dosyası bulundu ($BACKUP_COUNT adet)${NC}"
    ls -lh /tmp/database_backup_*.sql
else
    echo -e "${YELLOW}⚠️  /tmp/ dizininde veritabanı backup dosyası bulunamadı${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Özet
echo -e "\n========================================"
echo -e "📊 Kontrol Özeti"
echo -e "========================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Tüm kontroller başarılı! Kuruluma hazırsın.${NC}"
    echo -e "\n${GREEN}Sonraki adım: bash baslat.sh${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS uyarı var, ancak kuruluma devam edebilirsin.${NC}"
    echo -e "\n${YELLOW}Sonraki adım: bash baslat.sh${NC}"
else
    echo -e "${RED}❌ $ERRORS kritik hata var! Önce bunları düzelt.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Ayrıca $WARNINGS uyarı var.${NC}"
    fi
fi

echo ""
