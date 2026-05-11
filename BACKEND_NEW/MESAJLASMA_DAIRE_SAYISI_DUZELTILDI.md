# Mesajlaşma Sistemi Daire Sayısı Düzeltildi

## Sorun
- Veritabanında 97 daire var
- Mesajlaşma sisteminde sadece 85 daire gösteriliyordu
- 12 daire eksikti

## Neden?
`MessageService.getApartmentsForMessaging()` metodu sadece **site üyesi olan sakinlerin dairelerini** döndürüyordu:

```java
.filter(map -> map.containsKey("isSiteMember") && (Boolean) map.get("isSiteMember"))
```

Bu filtre nedeniyle:
- Site üyesi olmayan sakinlerin daireleri gösterilmiyordu
- Boş daireler gösterilmiyordu

## Çözüm
Filtreyi kaldırdık ve **TÜM daireleri** döndürmeye başladık:

```java
// TÜM daireleri döndür (boş daireler dahil)
.collect(Collectors.toList());
```

## Sonuç
✓ Artık mesajlaşma sisteminde **97 daire** gösteriliyor
✓ Boş daireler "Boş Daire" olarak işaretleniyor
✓ Site üyesi olmayan sakinlerin daireleri de listeleniyor

## Değişiklikler
- **Dosya**: `BACKEND_NEW/site/src/main/java/com/sitedefteri/service/MessageService.java`
- **Metod**: `getApartmentsForMessaging()`
- **Satır**: ~430

## Test
Backend yeniden başlatıldı ve değişiklik uygulandı.
