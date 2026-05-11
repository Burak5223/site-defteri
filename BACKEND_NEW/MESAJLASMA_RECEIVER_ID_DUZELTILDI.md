# Mesajlaşma Sistemi receiverId Düzeltmesi

## Tarih: 10 Mayıs 2026

## Problem
Sakin ve yönetici arasında mesajlar gönderiliyordu ancak mobil uygulamada görünmüyordu.

### Kök Neden
Backend `MessageService.java` dosyasında, `chatType='apartment'` olan TÜM mesajlar için `receiverId` otomatik olarak `NULL` yapılıyordu. Bu, daire bazlı mesajlaşma için tasarlanmıştı (hem malik hem kiracı görsün diye), ancak 1-1 direkt mesajlaşmayı bozuyordu.

```java
// ESKİ KOD (YANLIŞ):
if ("apartment".equals(request.getChatType()) && apartmentId != null) {
    message.setReceiverId(null); // NULL = dairede yaşayan herkes görsün
}
```

Bu yüzden:
- Mesajlar veritabanına kaydediliyordu ✅
- Ancak API response'da `receiverId` ve `receiverName` `null` dönüyordu ❌
- Mobil uygulama mesajları filtreleyemiyordu ❌

## Çözüm

### 1. MessageService.java Düzeltmesi
`receiverId` açıkça belirtilmişse (1-1 mesaj), onu kullan. Sadece `receiverId` null ise daire bazlı mesaj olarak işle.

```java
// YENİ KOD (DOĞRU):
if (request.getReceiverId() != null) {
    // 1-1 direct message - receiverId'yi kullan
    message.setReceiverId(request.getReceiverId());
    log.info("Direct message - receiverId set to: {}", request.getReceiverId());
    
    // Alıcının da site üyesi olup olmadığını kontrol et
    if (!isUserMemberOfSite(request.getReceiverId(), request.getSiteId())) {
        throw new IllegalArgumentException("Mesaj göndermek istediğiniz kullanıcı bu sitenin üyesi değil.");
    }
} else if ("apartment".equals(request.getChatType()) && apartmentId != null) {
    // Daire bazlı mesaj - receiverId NULL (hem malik hem kiracı görsün)
    message.setReceiverId(null);
    log.info("Apartment-wide message - receiverId set to NULL for apartment: {}", apartmentId);
}
```

### 2. MessageResponse DTO Güncelleme
`receiverName` ve `receiverRole` alanları eklendi:

```java
public class MessageResponse {
    // ... mevcut alanlar
    private String receiverId;
    private String receiverName;  // YENİ
    private String receiverRole;  // YENİ
    // ...
}
```

### 3. toResponse() Metodu Güncelleme
Receiver bilgilerini response'a ekle:

```java
private MessageResponse toResponse(Message message) {
    User sender = userRepository.findById(message.getSenderId()).orElse(null);
    
    // Receiver bilgisini al (eğer receiverId varsa)
    User receiver = null;
    if (message.getReceiverId() != null) {
        receiver = userRepository.findById(message.getReceiverId()).orElse(null);
    }
    
    return MessageResponse.builder()
        // ...
        .receiverId(message.getReceiverId())
        .receiverName(receiver != null ? receiver.getFullName() : null)
        .receiverRole(receiver != null ? getUserRole(receiver) : null)
        // ...
        .build();
}
```

## Test Sonuçları

### Önceki Durum (HATALI):
```
Admin mesajları: 6 mesaj yüklendi
   Sakin'den gelen: 0 mesaj ❌

Sakin mesajları: 13 mesaj yüklendi
   Admin'den gelen: 0 mesaj ❌
```

### Sonraki Durum (DOĞRU):
```
Admin mesajları: 8 mesaj yüklendi
   Sakin'den gelen: 1 mesaj ✅

Sakin mesajları: 15 mesaj yüklendi
   Admin'den gelen: 1 mesaj ✅

Mesajlaşma akışı:
1. 👤 Sakin → Admin: "Merhaba yönetici, test mesajı"
2. 👨‍💼 Admin → Sakin: "Merhaba sakin, cevap mesajı"
```

### API Response Örneği:
```json
{
  "id": "168",
  "senderId": "f0b9fe5d-8266-453b-a02a-87d67801a0b1",
  "senderName": "Sakin User",
  "receiverId": "69f6dde2-4927-420a-aa3b-e9226f5cfdbe",
  "receiverName": "Admin User",
  "chatType": "apartment",
  "body": "Merhaba yönetici, test mesajı",
  "apartmentId": "f1d9df81-7bec-4b9c-8c1c-69eff2951cec"
}
```

## Etkilenen Dosyalar
1. `BACKEND_NEW/site/src/main/java/com/sitedefteri/service/MessageService.java`
2. `BACKEND_NEW/site/src/main/java/com/sitedefteri/dto/response/MessageResponse.java`

## Mesaj Tipleri

### 1. Group Mesajlar (chatType='group')
- Tüm site sakinleri görür
- `receiverId` = NULL
- Site yönetimi genel duyuruları

### 2. Direct Mesajlar (chatType='apartment' + receiverId)
- Sadece gönderen ve alıcı görür
- `receiverId` = belirli kullanıcı ID
- Sakin ↔ Yönetici, Sakin ↔ Güvenlik, vb.

### 3. Daire Bazlı Mesajlar (chatType='apartment' + apartmentId, receiverId=NULL)
- Dairede yaşayan herkes görür (malik + kiracı)
- `receiverId` = NULL
- Personel → Daire mesajları

## Mobil Uygulama Davranışı

### Sakin Girişi:
- ✅ "Site Yönetimi" grup sohbeti görür
- ✅ "Özel Mesajlar" bölümünde Yönetici, Güvenlik, Temizlikçi kutuları görür
- ❌ "Daire Mesajları" bölümünü GÖRMEZ (sadece personel için)

### Yönetici/Güvenlik/Temizlikçi Girişi:
- ✅ "Site Yönetimi" grup sohbeti görür
- ✅ "Özel Mesajlar" bölümünde diğer rolleri görür
- ✅ "Daire Mesajları" bölümünde tüm daireleri görür

## Sonuç
✅ Backend düzeltildi ve yeniden başlatıldı
✅ Mesajlar artık doğru receiverId ile kaydediliyor
✅ API response'da receiverId ve receiverName dönüyor
✅ Test başarılı: Sakin ↔ Admin mesajlaşması çalışıyor
✅ Mobil uygulama artık mesajları gösterebilir
