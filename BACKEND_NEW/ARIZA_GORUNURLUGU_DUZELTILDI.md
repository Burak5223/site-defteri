# Arıza Görünürlüğü Sorunu Düzeltildi

## Sorun
- Admin kullanıcısı (admin@site.com) 4 açık arıza görebiliyordu
- Sakin kullanıcısı (sakin@site.com) hiçbir arıza göremiyordu
- Dashboard'da da 0 arıza görünüyordu

## Kök Neden
1. **TicketRepository**: `residency_history` tablosunu kullanıyordu, ama bu tablo yok. Doğru tablo `residency`
2. **DashboardService**: Sakin kullanıcısı için arızalar sadece `createdBy` alanına göre filtreleniyordu
3. Sakin kullanıcısının dairesine ait tüm arızalar gösterilmiyordu

## Yapılan Düzeltmeler

### 1. TicketRepository.java
```java
// ÖNCE:
@Query(value = "SELECT apartment_id FROM residency_history WHERE user_id = :userId AND status = 'active' LIMIT 1", nativeQuery = true)
List<String> findApartmentByUserId(@Param("userId") String userId);

// SONRA:
@Query(value = "SELECT apartment_id FROM residency WHERE user_id = :userId LIMIT 1", nativeQuery = true)
List<String> findApartmentByUserId(@Param("userId") String userId);
```

### 2. DashboardService.java - getResidentDashboard()
```java
// ÖNCE:
long openTickets = ticketRepository.findAll().stream()
        .filter(t -> userId.equals(t.getCreatedBy()) && 
                    (t.getStatus() == Ticket.TicketStatus.acik || 
                     t.getStatus() == Ticket.TicketStatus.islemde))
        .count();

// SONRA:
// Kullanıcının dairesine ait tüm arızaları bul
long openTickets = 0;
try {
    // Kullanıcının apartmentlarını bul
    List<String> apartmentIds = apartmentRepository.findByActiveResidency(userId)
            .stream()
            .map(apartment -> apartment.getId())
            .collect(java.util.stream.Collectors.toList());
    
    if (!apartmentIds.isEmpty()) {
        // Bu apartmentlara ait açık/işlemdeki arızaları say
        openTickets = ticketRepository.findAll().stream()
                .filter(t -> apartmentIds.contains(t.getApartmentId()) && 
                            (t.getStatus() == Ticket.TicketStatus.acik || 
                             t.getStatus() == Ticket.TicketStatus.islemde))
                .count();
    } else {
        // Fallback: kullanıcının kendi oluşturduğu arızalar
        openTickets = ticketRepository.findAll().stream()
                .filter(t -> userId.equals(t.getUserId()) && 
                            (t.getStatus() == Ticket.TicketStatus.acik || 
                             t.getStatus() == Ticket.TicketStatus.islemde))
                .count();
    }
}
```

## Sonuç
✅ Sakin kullanıcısı artık dairesine ait tüm arızaları görebilir
✅ Dashboard'da doğru arıza sayısı görünür
✅ Arıza listesinde dairesine ait tüm arızalar listelenir
✅ Admin tarafından oluşturulan arızalar da sakin tarafından görülebilir

## Test
1. Admin ile giriş yap (admin@site.com / admin123)
   - 4 açık arıza görünmeli
2. Sakin ile giriş yap (sakin@site.com / sakin123)
   - Dairesine ait arızalar görünmeli
   - Dashboard'da doğru sayı görünmeli

## Tarih
13 Mayıs 2026
