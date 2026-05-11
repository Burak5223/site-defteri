# Mesajlaşma Site Üyeliği Güncellemesi

## 📋 Yapılan Değişiklikler

### Amaç
Mesajlaşma sisteminde görünen tüm kullanıcıların, o sitenin aktif üyesi olmasını sağlamak.

### Değişiklik Detayları

#### 1. MessageService.java Güncellemeleri

##### ✅ Yeni Metod: `isUserMemberOfSite()`
```java
private boolean isUserMemberOfSite(String userId, String siteId)
```
- Kullanıcının belirli bir siteye üye olup olmadığını kontrol eder
- `user_site_memberships` tablosunu sorgular
- Sadece `is_deleted = FALSE` ve `status = 'aktif'` olan üyelikleri kabul eder

##### ✅ Güncellenen Metod: `createMessage()`
**Eklenen Kontroller:**
1. Mesaj gönderen kullanıcının site üyesi olup olmadığı kontrol edilir
2. Eğer `receiverId` varsa, alıcının da site üyesi olup olmadığı kontrol edilir
3. Site üyesi olmayan kullanıcılar mesaj gönderemez

**Hata Mesajları:**
- "Bu siteye mesaj gönderme yetkiniz yok. Lütfen site üyeliğinizi kontrol edin."
- "Mesaj göndermek istediğiniz kullanıcı bu sitenin üyesi değil."

##### ✅ Güncellenen Metod: `getSiteMessages()`
**Eklenen Filtreler:**
1. Kullanıcının site üyesi olup olmadığı kontrol edilir
2. Sadece site üyesi olan kullanıcıların mesajları döndürülür
3. Site üyesi olmayan kullanıcıların mesajları filtrelenir

##### ✅ Güncellenen Metod: `getGroupMessages()`
**Eklenen Filtreler:**
- Sadece site üyesi olan kullanıcıların grup mesajları gösterilir

##### ✅ Güncellenen Metod: `getApartmentMessages()`
**Eklenen Filtreler:**
- Sadece site üyesi olan kullanıcıların daire mesajları gösterilir

##### ✅ Güncellenen Metod: `getApartmentsForMessaging()`
**Eklenen Filtreler:**
1. Her dairenin sakininin site üyesi olup olmadığı kontrol edilir
2. Sadece site üyesi olan sakinlerin daireleri listelenir
3. Site üyesi olmayan sakinlerin daireleri "Boş Daire" olarak gösterilir
4. Response'a `isSiteMember` boolean alanı eklendi

## 🔍 Etkilenen Endpoint'ler

### 1. POST /api/messages
- ✅ Mesaj gönderen site üyesi olmalı
- ✅ Mesaj alan (varsa) site üyesi olmalı

### 2. GET /api/sites/{siteId}/messages
- ✅ Sadece site üyesi kullanıcıların mesajları gösterilir

### 3. GET /api/sites/{siteId}/messages/group
- ✅ Sadece site üyesi kullanıcıların grup mesajları gösterilir

### 4. GET /api/sites/{siteId}/apartments/{apartmentId}/messages
- ✅ Sadece site üyesi kullanıcıların daire mesajları gösterilir

### 5. GET /api/sites/{siteId}/messages/apartments
- ✅ Sadece site üyesi sakinlerin daireleri listelenir

## 📊 Veritabanı İlişkisi

### Kontrol Edilen Tablo: `user_site_memberships`

```sql
SELECT COUNT(*) 
FROM user_site_memberships 
WHERE user_id = ? 
  AND site_id = ? 
  AND is_deleted = FALSE 
  AND status = 'aktif'
```

### Gerekli Koşullar:
- `is_deleted = FALSE`: Silinmemiş kayıt
- `status = 'aktif'`: Aktif üyelik

## 🚀 Kullanım Senaryoları

### Senaryo 1: Mesaj Gönderme
```
Kullanıcı A → Site 1'e mesaj göndermek istiyor
✅ Kullanıcı A, Site 1'in üyesi → Mesaj gönderilir
❌ Kullanıcı A, Site 1'in üyesi değil → Hata: "Bu siteye mesaj gönderme yetkiniz yok"
```

### Senaryo 2: Mesaj Listeleme
```
Kullanıcı B → Site 1'in mesajlarını görmek istiyor
✅ Kullanıcı B, Site 1'in üyesi → Sadece site üyesi kullanıcıların mesajları gösterilir
❌ Kullanıcı B, Site 1'in üyesi değil → Boş liste döner
```

### Senaryo 3: Daire Mesajlaşması
```
Site 1'de 10 daire var
- 7 dairenin sakini site üyesi
- 3 dairenin sakini site üyesi değil

Sonuç: Sadece 7 daire mesajlaşma listesinde gösterilir
```

## ⚠️ Önemli Notlar

### 1. Geriye Dönük Uyumluluk
- Eski mesajlar silinmez
- Sadece yeni mesajlaşmalarda kontrol yapılır
- Mevcut mesajlar filtrelenerek gösterilir

### 2. Performans
- Her mesaj işleminde veritabanı sorgusu yapılır
- Cache mekanizması eklenebilir (opsiyonel)

### 3. Hata Yönetimi
- Site üyesi olmayan kullanıcılar için açıklayıcı hata mesajları
- Log kayıtları ile takip edilebilir

## 🧪 Test Senaryoları

### Test 1: Site Üyesi Mesaj Gönderme
```bash
# Kullanıcı: sakin@site.com (Site 1 üyesi)
POST /api/messages
{
  "siteId": "1",
  "chatType": "group",
  "body": "Merhaba"
}
# Beklenen: 200 OK
```

### Test 2: Site Üyesi Olmayan Mesaj Gönderme
```bash
# Kullanıcı: test@test.com (Site 1 üyesi değil)
POST /api/messages
{
  "siteId": "1",
  "chatType": "group",
  "body": "Merhaba"
}
# Beklenen: 400 Bad Request
# Mesaj: "Bu siteye mesaj gönderme yetkiniz yok"
```

### Test 3: Daire Listesi
```bash
GET /api/sites/1/messages/apartments
# Beklenen: Sadece site üyesi sakinlerin daireleri
```

## 📝 Geliştirme Önerileri

### 1. Cache Mekanizması
```java
@Cacheable(value = "siteMemberships", key = "#userId + '_' + #siteId")
private boolean isUserMemberOfSite(String userId, String siteId)
```

### 2. Bulk Kontrol
Çok sayıda mesaj için toplu kontrol:
```java
private Map<String, Boolean> checkMultipleUserMemberships(List<String> userIds, String siteId)
```

### 3. Audit Log
Site üyesi olmayan kullanıcıların mesaj gönderme denemelerini logla:
```java
auditService.logUnauthorizedMessageAttempt(userId, siteId);
```

## 🔧 Derleme ve Çalıştırma

### Backend Derleme
```bash
cd BACKEND_NEW/site
mvn clean package -DskipTests
```

### Backend Başlatma
```bash
java -jar target/site-backend-1.0.0.jar
```

## ✅ Tamamlanan İşler

- [x] `isUserMemberOfSite()` metodu eklendi
- [x] `createMessage()` güncellendi - site üyeliği kontrolü
- [x] `getSiteMessages()` güncellendi - mesaj filtreleme
- [x] `getGroupMessages()` güncellendi - grup mesajı filtreleme
- [x] `getApartmentMessages()` güncellendi - daire mesajı filtreleme
- [x] `getApartmentsForMessaging()` güncellendi - daire listesi filtreleme
- [x] Backend başarıyla derlendi

## 📅 Tarih
**Güncelleme Tarihi:** 6 Mayıs 2026
**Versiyon:** 1.0.0
**Durum:** ✅ Tamamlandı
