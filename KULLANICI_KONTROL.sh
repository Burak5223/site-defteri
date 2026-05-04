#!/bin/bash

echo "👤 Kullanıcı ve Veritabanı Kontrol Scripti"
echo "========================================"

BASE_URL="http://localhost:8080"

echo "🔍 Test 1: Auth Endpoint Kontrolü"
echo "POST $BASE_URL/api/auth/login (boş data ile)"

response=$(curl -s -w "HTTP_CODE:%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$BASE_URL/api/auth/login")

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "HTTP Code: $http_code"
echo "Yanıt: $body"
echo ""

echo "🔍 Test 2: Validation Hatası Kontrolü"
echo "POST $BASE_URL/api/auth/login (eksik field)"

response=$(curl -s -w "HTTP_CODE:%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"test"}' \
  "$BASE_URL/api/auth/login")

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "HTTP Code: $http_code"
echo "Yanıt: $body"
echo ""

echo "🔍 Test 3: Gerçek Login Denemesi"
echo "POST $BASE_URL/api/auth/login (test kullanıcı)"

login_data='{
    "phoneNumber": "05551234567",
    "password": "123456"
}'

response=$(curl -s -w "HTTP_CODE:%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$login_data" \
  "$BASE_URL/api/auth/login")

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "HTTP Code: $http_code"
echo "Yanıt: $body"
echo ""

echo "🔍 Test 4: Register Endpoint Kontrolü"
echo "POST $BASE_URL/api/auth/register"

register_data='{
    "phoneNumber": "05559999999",
    "password": "123456",
    "firstName": "Test",
    "lastName": "User",
    "siteId": "1",
    "apartmentId": "1",
    "role": "RESIDENT"
}'

response=$(curl -s -w "HTTP_CODE:%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$register_data" \
  "$BASE_URL/api/auth/register")

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "HTTP Code: $http_code"
echo "Yanıt: $body"
echo ""

echo "🔍 Test 5: Yeni Kullanıcı ile Login"
echo "POST $BASE_URL/api/auth/login (yeni kullanıcı)"

new_login_data='{
    "phoneNumber": "05559999999",
    "password": "123456"
}'

response=$(curl -s -w "HTTP_CODE:%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$new_login_data" \
  "$BASE_URL/api/auth/login")

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "HTTP Code: $http_code"
echo "Yanıt: $body"

if [ "$http_code" = "200" ]; then
    echo "✅ Token başarıyla alındı!"
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "🔑 Token: ${TOKEN:0:50}..."
    fi
else
    echo "❌ Token alınamadı"
fi
echo ""

echo "======================================="
echo "🏁 Kullanıcı Kontrol Testi Tamamlandı!"
echo "======================================="

echo ""
echo "📊 SONUÇLAR:"
echo "- Auth endpoint çalışıyor mu?"
echo "- Validation hataları doğru mu?"
echo "- Register işlemi çalışıyor mu?"
echo "- Login işlemi çalışıyor mu?"