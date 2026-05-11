# Tüm Sorunlar Düzeltildi

## Sorunlar

1. **Duplicate daire numaraları**: Aynı numara farklı bloklarda tekrar ediyordu
2. **107 daire gösterimi**: Backend 102 yerine 107 daire sayıyordu
3. **Blok toplamları tutmuyordu**: Blokların malik toplamı 102 etmiyordu
4. **Bazı dairelere sakin atanmamıştı**: Boş daireler vardı

## Çözümler

### 1. Daire Numaraları Benzersiz Yapıldı
- Tüm daireler 1'den 102'ye kadar benzersiz numaralarla yeniden numaralandırıldı
- **A Blok**: 1-34 (34 daire)
- **B Blok**: 35-68 (34 daire)
- **C Blok**: 69-102 (34 daire)

### 2. Backend Repository Düzeltildi
`ApartmentRepository.countBySiteId()` metodu `is_deleted = 0` kontrolü yapmıyordu.

**Önceki kod:**
```java
@Query(value = "SELECT COUNT(*) FROM apartments a " +
       "JOIN blocks b ON a.block_id = b.id " +
       "WHERE b.site_id = :siteId", 
       nativeQuery = true)
long countBySiteId(@Param("siteId") String siteId);
```

**Yeni kod:**
```java
@Query(value = "SELECT COUNT(*) FROM apartments a " +
       "JOIN blocks b ON a.block_id = b.id " +
       "WHERE b.site_id = :siteId AND a.is_deleted = 0", 
       nativeQuery = true)
long countBySiteId(@Param("siteId") String siteId);
```

### 3. Tüm Dairelere Sakin Atandı
- Her daireye malik atandı (102 malik)
- %36 dairede kiracı var (37 kiracı)
- Toplam 107 benzersiz sakin

### 4. Malik/Kiracı Oranı Dengelendi
- **Malik olan daire**: 102 (tüm daireler)
- **Kiracı olan daire**: 37 (%36)
- **Sadece malik olan daire**: 65 (%64)

## Son Durum

### Veritabanı
- ✓ Toplam daire: 102
- ✓ Duplicate numara: 0
- ✓ Sahibi olmayan daire: 0
- ✓ Malik olan daire: 102
- ✓ Kiracı olan daire: 37
- ✓ Benzersiz sakin: 107

### Blok Dağılımı
- ✓ A Blok: 34 daire (1-34)
- ✓ B Blok: 34 daire (35-68)
- ✓ C Blok: 34 daire (69-102)

### Backend
- ✓ `countBySiteId()` artık sadece aktif daireleri sayıyor
- ✓ `findBySiteId()` artık sadece aktif daireleri getiriyor
- ✓ `findBySiteIdIn()` artık sadece aktif daireleri getiriyor

## Değişiklikler

1. **Dosya**: `BACKEND_NEW/site/src/main/java/com/sitedefteri/repository/ApartmentRepository.java`
   - `countBySiteId()` metoduna `is_deleted = 0` kontrolü eklendi
   - `findBySiteId()` metoduna `is_deleted = 0` kontrolü eklendi
   - `findBySiteIdIn()` metoduna `is_deleted = 0` kontrolü eklendi

2. **Script**: `BACKEND_NEW/drop_constraint_and_renumber.py`
   - Tüm daireler benzersiz numaralarla yeniden numaralandırıldı

3. **Script**: `BACKEND_NEW/rebalance_owner_tenant_ratio.py`
   - Malik/kiracı oranı dengelendi

## Test

Backend yeniden başlatıldı ve tüm değişiklikler uygulandı.
