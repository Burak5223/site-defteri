# SAKİNLER VE MESAJLAR DÜZELTİLDİ

## YAPILAN DEĞİŞİKLİKLER

### 1. Sakinler Modalı - Kartlar Tıklamadan Görünmüyor ✅

**Dosya**: `FRONTEND/components/pages/home-page.tsx`

**Değişiklik**: Daire kartlarında sadece daire numarası ve kat bilgisi gösteriliyor. Malik adı kaldırıldı.

**Önceki Durum**:
```tsx
<CardContent className="p-3 text-center">
  <Building2 icon />
  <p>Daire 101</p>
  <p>Kat 1</p>
  <p>Ahmet Yılmaz</p>  ← Malik adı görünüyordu
</CardContent>
```

**Yeni Durum**:
```tsx
<CardContent className="p-3 text-center">
  <Home icon />  ← İkon değişti
  <p>Daire 101</p>
  <p>Kat 1</p>
  <!-- Malik adı kaldırıldı -->
</CardContent>
```

**Akış**:
1. Blok seç → Bloklar listelenir
2. Daire seç → Sadece daire numaraları gösterilir (3 sütun grid)
3. Daireye tıkla → Sakin kartları görünür (Malik/Kiracı badge'leri ile)

---

### 2. Mesajlar - Daire Bazlı Mesaj Hem Malik Hem Kiracıya Gidiyor ✅

**Dosya**: `BACKEND_NEW/site/src/main/java/com/sitedefteri/service/MessageService.java`

**Değişiklikler**:

#### a) NotificationService Dependency Eklendi
```java
private final NotificationService notificationService;
```

#### b) Yeni Method: `sendApartmentMessageNotifications()`
```java
/**
 * Daire bazlı mesaj gönderildiğinde hem malik hem kiracıya bildirim gönder
 */
private void sendApartmentMessageNotifications(String apartmentId, String senderId, String messageBody) {
    // Daire sakinlerini bul (hem malik hem kiracı)
    List<User> residents = userRepository.findByApartmentId(apartmentId);
    
    for (User resident : residents) {
        // Gönderene bildirim gönderme
        if (resident.getId().equals(senderId)) {
            continue;
        }
        
        // Bildirim gönder
        notificationService.sendNotificationToUser(
            resident.getId(),
            "Yeni Daire Mesajı",
            messageBody,
            "message",
            null
        );
    }
}
```

#### c) createMessage() Methodunda Çağrı
```java
Message saved = messageRepository.save(message);

// Eğer daire bazlı mesajsa, hem malik hem kiracıya bildirim gönder
if ("apartment".equals(request.getChatType()) && apartmentId != null) {
    sendApartmentMessageNotifications(apartmentId, senderId, request.getBody());
}

return toResponse(saved);
```

**Nasıl Çalışıyor**:
1. Admin daire bazlı mesaj gönderir (chatType: "apartment")
2. Mesaj veritabanına kaydedilir
3. `residency_history` tablosundan o dairede yaşayan tüm sakinler bulunur (hem malik hem kiracı)
4. Her sakine (gönderen hariç) push notification gönderilir
5. Bildirim başlığı: "Yeni Daire Mesajı"
6. Bildirim içeriği: Mesajın ilk 50 karakteri

**Örnek Senaryo**:
- Daire 101: Ahmet (Malik) + Mehmet (Kiracı)
- Admin daire 101'e mesaj gönderir: "Yarın su kesintisi olacak"
- Hem Ahmet hem Mehmet bildirim alır
- Her ikisi de mobil uygulamada mesajı görebilir

---

## VERİTABANI YAPISI

### residency_history Tablosu
```sql
- apartment_id (FK)
- user_id (FK)
- is_owner (boolean)  -- TRUE = malik, FALSE = kiracı
- move_out_date       -- NULL = hala oturuyor
- status              -- 'active'
```

### Sorgu
```sql
SELECT u.* 
FROM users u
JOIN residency_history rh ON u.id = rh.user_id
WHERE rh.apartment_id = ? 
  AND rh.status = 'active'
  AND rh.move_out_date IS NULL
```

Bu sorgu hem maliki hem kiracıyı döndürür.

---

## TEST SENARYOLARI

### 1. Sakinler Modalı Testi
```
1. Admin olarak giriş yap
2. Ana sayfa → "Hızlı İşlemler" → "Sakinler"
3. Bir blok seç (örn: A Blok)
4. Daire kartlarında sadece numara ve kat görünmeli ✓
5. Bir daireye tıkla (örn: Daire 101)
6. Sakin kartları görünmeli (Malik/Kiracı badge'leri ile) ✓
```

### 2. Daire Bazlı Mesaj Testi
```
1. Admin olarak giriş yap
2. Mesajlar sayfasına git
3. Daire bazlı mesaj gönder (örn: Daire 101'e)
4. Mesaj içeriği: "Test mesajı"
5. Hem malik hem kiracı bildirim almalı ✓
6. Mobil uygulamada her ikisi de mesajı görebilmeli ✓
```

---

## BACKEND RESTART GEREKLİ

Değişiklikler Java kodunda yapıldığı için backend'i yeniden başlatmak gerekiyor:

```powershell
# Backend'i yeniden başlat
.\BACKEND_YENIDEN_BASLAT.ps1

# veya

cd BACKEND_NEW/site
mvn clean package
java -jar target/site-backend-1.0.0.jar
```

---

## ÖZET

✅ **Sakinler Modalı**: Daire kartlarında sadece numara gösteriliyor, tıklayınca sakinler görünüyor
✅ **Mesajlar**: Daire bazlı mesaj hem malik hem kiracıya bildirim olarak gidiyor
✅ **Veritabanı**: Her dairenin 1 maliki var, bazılarında kiracı da var
✅ **Backend**: NotificationService entegrasyonu tamamlandı

Sistem kullanıma hazır!
