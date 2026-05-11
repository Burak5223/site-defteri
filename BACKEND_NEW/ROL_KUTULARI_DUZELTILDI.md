# Rol Kutuları Düzeltildi (Role Boxes Fixed)

## Problem
Sakin kullanıcılar mesajlaşma ekranında rol kutularını (Yönetici, Güvenlik, Temizlikçi) göremiyordu.

## Kök Neden (Root Cause)
`UserService.getAllUsersBySite()` metodu sadece dairelere atanmış kullanıcıları döndürüyordu. Personel kullanıcıları (admin, güvenlik, temizlik) dairelere atanmadığı için listede görünmüyordu.

## Çözüm (Solution)

### Backend Değişikliği
**Dosya:** `BACKEND_NEW/site/src/main/java/com/sitedefteri/service/UserService.java`

`getAllUsersBySite()` metoduna personel kullanıcılarını da dahil etmek için kod eklendi:

```java
// Also get all staff users (ADMIN, SECURITY, CLEANING) from the same sites
List<UserSiteMembership> staffMemberships = membershipRepository.findBySiteIdIn(userSiteIds);
Set<String> staffUserIds = staffMemberships.stream()
        .filter(m -> {
            String roleType = m.getRoleType();
            return "ROLE_ADMIN".equals(roleType) || 
                   "ROLE_SECURITY".equals(roleType) || 
                   "ROLE_CLEANING".equals(roleType) ||
                   "ADMIN".equals(roleType) ||
                   "SECURITY".equals(roleType) ||
                   "CLEANING".equals(roleType) ||
                   "personel".equals(roleType) || 
                   "yonetici".equals(roleType);
        })
        .map(m -> m.getUser().getId())
        .collect(Collectors.toSet());

// Combine apartment users and staff users
Set<String> allUserIds = new HashSet<>();
allUserIds.addAll(apartmentUserIds);
allUserIds.addAll(staffUserIds);
```

### Değişiklik Detayları
1. `user_site_memberships` tablosundan aynı sitedeki tüm personel kullanıcılarını çek
2. `roleType` alanına göre filtrele (ROLE_ADMIN, ROLE_SECURITY, ROLE_CLEANING)
3. Daire kullanıcıları ile personel kullanıcılarını birleştir
4. Tüm kullanıcıları döndür

## Test Sonuçları

### Backend API Test
```bash
python BACKEND_NEW/test_resident_role_boxes.py
```

**Sonuç:**
- ✓ Sakin kullanıcı girişi başarılı
- ✓ `/api/users` endpoint 162 kullanıcı döndürüyor
- ✓ Admin: 1 kullanıcı (Admin User)
- ✓ Güvenlik: 1 kullanıcı (Güvenlik User)
- ✓ Temizlik: 1 kullanıcı (Temizlik User)

### Frontend Davranışı
Artık `MessagesScreen.tsx` içindeki `loadContacts()` fonksiyonu:
1. `/api/users` endpoint'inden tüm kullanıcıları alır
2. Rollere göre filtreler (ADMIN, SECURITY, CLEANING)
3. Her rol için bir kutucuk oluşturur
4. Sakin kullanıcılar bu kutucukları görebilir

## Etkilenen Dosyalar
- ✅ `BACKEND_NEW/site/src/main/java/com/sitedefteri/service/UserService.java`
- ✅ Backend rebuild ve restart yapıldı

## Kullanıcı Deneyimi
Artık sakin kullanıcılar mesajlaşma ekranında şunları görecek:
1. **Site Yönetimi** - Grup mesajları
2. **Özel Mesajlar** bölümü:
   - **Yönetici** kutusu (admin ile mesajlaşma)
   - **Güvenlik** kutusu (güvenlik ile mesajlaşma)
   - **Temizlikçi** kutusu (temizlik personeli ile mesajlaşma)
3. **Daire Mesajları** - Blok ve daire bazlı mesajlaşma

## Tarih
8 Mayıs 2026

## Durum
✅ TAMAMLANDI - Backend düzeltildi ve test edildi
