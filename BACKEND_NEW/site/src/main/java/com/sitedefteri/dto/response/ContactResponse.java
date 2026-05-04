package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    private String userId;
    private String fullName;
    private String role;
    private String apartmentInfo; // "Blok A - Daire 5" veya null
    private String lastMessage;
    private String lastMessageTime;
    private Integer unreadCount;
}
