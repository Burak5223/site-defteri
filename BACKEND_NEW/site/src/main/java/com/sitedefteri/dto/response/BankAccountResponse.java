package com.sitedefteri.dto.response;

import lombok.Data;

@Data
public class BankAccountResponse {
    private String id;
    private String siteId;
    private String bankName;
    private String branch;
    private String iban;
    private String accountHolder;
    private Boolean isActive;
}
