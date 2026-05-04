#!/bin/bash

echo "================================"
echo "Site Yonetim Sistemi Baslatiliyor"
echo "================================"
echo ""

# Proje dizinine git
cd BACKEND_NEW/site

echo "1. Eski containerlar durduruluyor..."
docker-compose down

echo ""
echo "2. Docker imajlari olusturuluyor..."
docker-compose build

echo ""
echo "3. Containerlar baslatiliyor..."
docker-compose up -d

echo ""
echo "4. Container durumu kontrol ediliyor..."
docker-compose ps

echo ""
echo "5. Backend loglarini izliyoruz (CTRL+C ile cikabilirsiniz)..."
echo ""
docker-compose logs -f backend
