#!/bin/bash

echo "================================"
echo "Docker Kurulumu Basliyor"
echo "================================"
echo ""

# Eski Docker paketlerini kaldır
echo "1. Eski Docker paketleri temizleniyor..."
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null

# Sistem güncellemesi
echo ""
echo "2. Sistem guncelleniyor..."
apt-get update

# Gerekli paketleri kur
echo ""
echo "3. Gerekli paketler kuruluyor..."
apt-get install -y ca-certificates curl gnupg lsb-release

# Docker GPG anahtarını ekle
echo ""
echo "4. Docker GPG anahtari ekleniyor..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Docker deposunu ekle
echo ""
echo "5. Docker deposu ekleniyor..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Paket listesini güncelle
echo ""
echo "6. Paket listesi guncelleniyor..."
apt-get update

# Docker'ı kur
echo ""
echo "7. Docker kuruluyor..."
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker servisini başlat
echo ""
echo "8. Docker servisi baslatiliyor..."
systemctl start docker
systemctl enable docker

# Test et
echo ""
echo "================================"
echo "Kurulum Tamamlandi!"
echo "================================"
echo ""
docker --version
echo ""
echo "Docker servisi durumu:"
systemctl status docker --no-pager
echo ""
echo "Test ediliyor..."
docker run hello-world
