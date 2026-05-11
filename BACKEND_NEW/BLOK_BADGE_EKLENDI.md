# Blok ve Blok Dropdown'a Okunmamış Mesaj Badge'i Eklendi

## Tarih: 10 Mayıs 2026

## Değişiklik

Mesajlar ekranında "Daire Mesajları" bölümünde:
1. **Bloklar dropdown'ının üzerinde** toplam okunmamış mesaj sayısı badge'i
2. **Her blok item'ının üzerinde** o bloktaki okunmamış mesaj sayısı badge'i

## Özellikler

### 1. Bloklar Dropdown Badge
- Tüm bloklardaki tüm dairelerin okunmamış mesajlarının toplamını gösterir
- Kırmızı badge ile görünür
- Mesajlar okunana kadar kalır
- Hiç okunmamış mesaj yoksa badge görünmez

```typescript
{(() => {
  // Tüm bloklardaki okunmamış mesaj sayısı
  const totalBlockUnread = apartments.reduce((sum, apt) => {
    return sum + getUnreadCount(undefined, apt.id);
  }, 0);
  
  return totalBlockUnread > 0 ? (
    <View style={styles.unreadBadge}>
      <Text style={styles.unreadText}>{totalBlockUnread}</Text>
    </View>
  ) : null;
})()}
```

### 2. Blok Item Badge
- Her blok için sadece o bloktaki dairelerin okunmamış mesajlarını gösterir
- Kırmızı badge ile görünür
- Mesajlar okunana kadar kalır
- Hiç okunmamış mesaj yoksa badge görünmez

```typescript
const blockUnreadCount = blockApartments.reduce((sum, apt) => {
  return sum + getUnreadCount(undefined, apt.id);
}, 0);

{blockUnreadCount > 0 && (
  <View style={styles.unreadBadge}>
    <Text style={styles.unreadText}>{blockUnreadCount}</Text>
  </View>
)}
```

## Görünüm

### Bloklar Dropdown (Kapalı)
```
┌─────────────────────────────────────┐
│ 🏢 Bloklar                    [5] ▼ │
│    3 blok • 97 daire                │
└─────────────────────────────────────┘
```

### Bloklar Dropdown (Açık)
```
┌─────────────────────────────────────┐
│ 🏢 Bloklar                    [5] ▲ │
│    3 blok • 97 daire                │
├─────────────────────────────────────┤
│ 🏢 A Blok              [2] →        │
│    32 daire                         │
├─────────────────────────────────────┤
│ 🏢 B Blok              [3] →        │
│    33 daire                         │
├─────────────────────────────────────┤
│ 🏢 C Blok                  →        │
│    32 daire                         │
└─────────────────────────────────────┘
```

## Badge Davranışı

### Okunmamış Mesaj Sayısı Hesaplama
```typescript
const getUnreadCount = (roleGroup?: RoleGroup, apartmentId?: string, isSystem?: boolean) => {
  if (apartmentId) {
    return messages.filter(m => 
      m.chatType === 'apartment' && 
      m.apartmentId === apartmentId &&
      m.receiverId === userId &&
      !m.isRead
    ).length;
  }
  return 0;
};
```

### Badge Görünürlüğü
- ✅ Badge sadece okunmamış mesaj varsa görünür
- ✅ Mesaj okunduğunda badge otomatik güncellenir
- ✅ Badge sayısı gerçek zamanlı güncellenir
- ✅ Tüm daireler okunduğunda badge kaybolur

## Kullanım Senaryoları

### Senaryo 1: Yeni Mesaj Geldiğinde
1. Personel bir daireye mesaj gönderir
2. Bloklar dropdown'ında badge sayısı artar
3. İlgili blok item'ında badge sayısı artar
4. Daire item'ında badge görünür

### Senaryo 2: Mesaj Okunduğunda
1. Kullanıcı daireye tıklar ve mesajları okur
2. Mesajlar `isRead: true` olarak işaretlenir
3. Daire item'ındaki badge kaybolur
4. Blok item'ındaki badge sayısı azalır
5. Bloklar dropdown'ındaki badge sayısı azalır

### Senaryo 3: Tüm Mesajlar Okunduğunda
1. Kullanıcı tüm dairelerdeki mesajları okur
2. Tüm badge'ler kaybolur
3. Temiz bir görünüm kalır

## Etkilenen Dosyalar
- `SiteYonetimApp/src/screens/messages/MessagesScreen.tsx`

## Teknik Detaylar

### Badge Pozisyonu
- Badge, ChevronRight ikonundan önce gelir
- `marginLeft: 12` ile sağdan boşluk bırakır
- `flexDirection: 'row'` ile yatay hizada

### Badge Stili
```typescript
unreadBadge: {
  minWidth: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#ef4444',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 8,
  marginLeft: 12,
}
```

## Test Senaryoları

### Test 1: Badge Görünürlüğü
- ✅ Okunmamış mesaj varsa badge görünür
- ✅ Okunmamış mesaj yoksa badge görünmez

### Test 2: Badge Sayısı
- ✅ Doğru sayıda okunmamış mesaj gösterir
- ✅ Blok badge'i = bloktaki tüm dairelerin toplamı
- ✅ Dropdown badge'i = tüm blokların toplamı

### Test 3: Badge Güncelleme
- ✅ Mesaj okunduğunda badge güncellenir
- ✅ Yeni mesaj geldiğinde badge güncellenir
- ✅ Gerçek zamanlı güncelleme çalışır

## Sonuç
✅ Bloklar dropdown'ına toplam badge eklendi
✅ Her blok item'ına badge eklendi
✅ Badge'ler mesaj okunana kadar kalıyor
✅ Badge sayıları doğru hesaplanıyor
✅ Görsel olarak tutarlı ve kullanıcı dostu
