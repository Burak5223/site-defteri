#!/bin/bash
# Backend Durdurma Scripti
# Kullanım: bash durdur.sh

echo "🛑 Backend Durduruluyor..."

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Container'ları durdur
docker-compose down

echo -e "\n${GREEN}✅ Backend durduruldu${NC}"
echo -e "\n${CYAN}📋 Yeniden başlatmak için:${NC}"
echo -e "  ${YELLOW}bash baslat.sh${NC}"
