#!/bin/bash
# Veritabanı Yedekleme Scripti
# Kullanım: bash yedek_al.sh

set -e

echo "💾 Veritabanı Yedekleniyor..."

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Yedek dizini oluştur
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Tarih damgası
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"

# Veritabanını yedekle
echo -e "${YELLOW}⏳ Yedekleme başlıyor...${NC}"

docker-compose exec -T mysql mysqldump -u root -p${DB_ROOT_PASSWORD:-Hilton5252.} smart_site_management > $BACKUP_FILE

if [ -f $BACKUP_FILE ]; then
    FILE_SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo -e "${GREEN}✅ Yedekleme başarılı!${NC}"
    echo -e "${CYAN}📁 Dosya: $BACKUP_FILE${NC}"
    echo -e "${CYAN}📊 Boyut: $FILE_SIZE${NC}"
    
    # Eski yedekleri temizle (30 günden eski)
    echo -e "\n${YELLOW}🧹 Eski yedekler temizleniyor (30+ gün)...${NC}"
    find $BACKUP_DIR -name "database_backup_*.sql" -mtime +30 -delete
    
    echo -e "\n${CYAN}📋 Mevcut yedekler:${NC}"
    ls -lh $BACKUP_DIR/database_backup_*.sql 2>/dev/null || echo "Yedek bulunamadı"
else
    echo -e "${RED}❌ Yedekleme başarısız!${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 İşlem tamamlandı!${NC}"
