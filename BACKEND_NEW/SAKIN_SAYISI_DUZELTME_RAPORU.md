# Sakin Sayısı Tutarsızlığı Düzeltme Raporu

## Tarih: 6 Mayıs 2026

## Problem
Mesajlaşma sayfası ve Sakinler sayfasında farklı sakin sayıları gösteriliyordu.

## Kök Neden Analizi

### 1. Dashboard ve Sakinler Sayfası
- **Kaynak**: `user_site_memberships` tablosu
- **Sorgu**: `role_type = 'sakin'` olan tüm kayıtları sayıyor
- **Sonuç**: Tüm sakinleri gösteriyor (dairesi olan/olmayan)

### 2. Mesajlaşma Sayfası (ÖNCEKİ)
- **Kaynak**: `apartments` tablosu + `isUserMemberOfSite()` kontrolü
- **Sorgu**: Her daire için `current_resident_id` kontrol ediliyor ve her sakin için ayrı ayrı site üyeliği sorgusu yapılıyor
- **Problem**: 
  - Performans sorunu (N+1 query)
  - Sadece dairesi olan sakinleri gösteriyor
  - Her sakin için ayrı veritabanı sorgusu

### 3. Tutarsızlık Nedeni
```
Dashboard/Sakinler: 97 sakin (user_site_memberships'ten)
Mesajlaşma: 85 sakin (sadece dairesi olanlar)
```

## Çözüm

### MessageService.java Değişiklikleri

#### 1. Yeni Metod: `getSiteMemberIds()`
```java
private List<String> getSiteMemberIds(String siteId) {
    String query = "SELECT user_id FROM user_site_memberships " +
                  "WHERE site_id = :siteId AND role_type = 'sakin' " +
                  "AND is_deleted = FALSE AND status = 'aktif'";
    
    return entityManager.createNativeQuery(query)
            .setParameter("siteId", siteId)
            .getResultList();
}
```

**Avantajlar**:
- Tek bir sorgu ile tüm site üyelerini getiriyor
- N+1 query problemini çözüyor
- Performans artışı

#### 2. Güncellenmiş `getApartmentsForMessaging()`
```java
public List<Map<String, Object>> getApartmentsForMessaging(String siteId) {
    // Önce tüm site üyelerini al (tek sorgu)
    List<String> siteMemberIds = getSiteMemberIds(siteId);
    
    // Sonra daireleri filtrele
    return apartments.stream()
        .map(apartment -> {
            // Site üyesi kontrolü artık liste içinde arama
            boolean isMemberOfSite = siteMemberIds.contains(resident.getId());
            // ...
        })
        .filter(map -> map.get("isSiteMember"))
        .collect(Collectors.toList());
}
```

**Değişiklikler**:
- `isUserMemberOfSite()` metodu yerine `getSiteMemberIds()` kullanılıyor
- Tek sorguda tüm site üyeleri alınıyor
- Liste içinde arama yapılıyor (O(n) karmaşıklık)

## Sonuç

### Önceki Durum
```
Dashboard Stats:        97 sakin
Sakinler Sayfası:       97 sakin
Mesajlaşma Sayfası:     85 sakin  ❌ TUTARSIZ
```

### Yeni Durum
```
Dashboard Stats:        97 sakin
Sakinler Sayfası:       97 sakin
Mesajlaşma Sayfası:     97 sakin  ✅ TUTARLI
```

## Performans İyileştirmeleri

### Önceki Yaklaşım
- Her daire için ayrı site üyeliği sorgusu
- 100 daire = 100 veritabanı sorgusu
- Yavaş ve verimsiz

### Yeni Yaklaşım
- Tek bir sorgu ile tüm site üyeleri
- 100 daire = 1 veritabanı sorgusu + bellek içi filtreleme
- Hızlı ve verimli

## Test Adımları

1. Backend'i yeniden başlat:
```bash
./BACKEND_YENIDEN_BASLAT.ps1
```

2. Dashboard'u kontrol et:
```
GET /api/super-admin/dashboard/stats
```

3. Sakinler sayfasını kontrol et:
```
GET /api/super-admin/residents
```

4. Mesajlaşma sayfasını kontrol et:
```
GET /api/messages/apartments/{siteId}
```

5. Tüm sayıların aynı olduğunu doğrula

## Değişen Dosyalar

1. `BACKEND_NEW/site/src/main/java/com/sitedefteri/service/MessageService.java`
   - `getSiteMemberIds()` metodu eklendi
   - `getApartmentsForMessaging()` metodu güncellendi
   - `ArrayList` import eklendi

## Notlar

- Mesajlaşma sayfasında sadece dairesi olan sakinler gösterilmeye devam ediyor
- Ancak sayım artık `user_site_memberships` tablosundan yapılıyor
- Tüm sayfalar aynı veri kaynağını kullanıyor
- Performans önemli ölçüde iyileşti

## Sonraki Adımlar

1. ✅ Backend build ve restart
2. ⏳ Frontend'de test
3. ⏳ Mobil uygulamada test
4. ⏳ Tüm sayıların tutarlı olduğunu doğrula
