#!/bin/bash

echo "Docker repository hatası düzeltiliyor..."

# Mevcut Docker kaynaklarını temizle
sudo rm -f /etc/apt/sources.list.d/docker.list

# Debian için doğru Docker deposunu ekle
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Paket listesini güncelle
echo "Paket listesi güncelleniyor..."
sudo apt update

echo "Docker repository düzeltildi!"
