# Arıza Listesi Boş Gelme Sorunu Düzeltildi

## Sorun
- Dashboard'da 2 arıza gösteriyordu
- Arızalar sayfasına tıklayınca liste boş geliyordu
- "Veri yok" mesajı görünüyordu

## Kök Neden
**TicketResponse DTO'su eksik alanlara sahipti**

Frontend'e dönen response'da sadece şu alanlar vardı:
- id
- title
- description
- category
- status
- priority
- createdAt

Ama frontend şu alanlara da ihtiyaç duyuyordu:
- ticketNumber
- userId
- apartmentId
- siteId
- assignedTo
- createdBy
- updatedBy
- updatedAt
- resolvedAt

## Yapılan Düzeltmeler

### 1. TicketResponse.java - Eksik Alanlar Eklendi
```java
@Data
public class TicketResponse {
    private String id;
    private String ticketNumber;        // YENİ
    private String title;
    private String description;
    private String category;
    private String status;
    private String priority;
    private String userId;              // YENİ
    private String apartmentId;         // YENİ
    private String siteId;              // YENİ
    private String assignedTo;          // YENİ
    private String createdBy;           // YENİ
    private String updatedBy;           // YENİ
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;    // YENİ
    private LocalDateTime resolvedAt;   // YENİ
}
```

### 2. TicketService.java - toResponse() Metodu Güncellendi
```java
private TicketResponse toResponse(Ticket ticket) {
    TicketResponse response = new TicketResponse();
    response.setId(ticket.getId());
    response.setTicketNumber(ticket.getTicketNumber());
    response.setTitle(ticket.getTitle());
    response.setDescription(ticket.getDescription());
    response.setCategory(ticket.getCategory());
    response.setStatus(mapEnumToStatus(ticket.getStatus()));
    response.setPriority(ticket.getPriority().name());
    response.setUserId(ticket.getUserId());
    response.setApartmentId(ticket.getApartmentId());
    response.setAssignedTo(ticket.getAssignedTo());
    response.setCreatedBy(ticket.getCreatedBy());
    response.setUpdatedBy(ticket.getUpdatedBy());
    response.setCreatedAt(ticket.getCreatedAt());
    response.setUpdatedAt(ticket.getUpdatedAt());
    response.setResolvedAt(ticket.getResolvedAt());
    response.setSiteId(ticket.getSiteId());
    return response;
}
```

## Sonuç
✅ Arıza listesi artık düzgün görünüyor
✅ Tüm arıza detayları frontend'e gönderiliyor
✅ Dashboard ve liste sayfası tutarlı çalışıyor

## Test
1. Sakin ile giriş yap (sakin@site.com / sakin123)
2. Dashboard'da arıza sayısını gör
3. Arızalar sayfasına tıkla
4. Arızaların listesini gör

## Tarih
13 Mayıs 2026
