package com.sitedefteri.service;

import com.sitedefteri.dto.request.AssignApartmentRequest;
import com.sitedefteri.dto.request.InviteUserRequest;
import com.sitedefteri.dto.request.UpdateUserRequest;
import com.sitedefteri.dto.response.UserResponse;
import com.sitedefteri.entity.Apartment;
import com.sitedefteri.entity.Site;
import com.sitedefteri.entity.User;
import com.sitedefteri.entity.UserSiteMembership;
import com.sitedefteri.exception.BadRequestException;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.ApartmentRepository;
import com.sitedefteri.repository.BlockRepository;
import com.sitedefteri.repository.SiteRepository;
import com.sitedefteri.repository.UserRepository;
import com.sitedefteri.repository.UserSiteMembershipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final BlockRepository blockRepository;
    private final UserSiteMembershipRepository membershipRepository;
    private final SiteRepository siteRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsService smsService;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    /**
     * Get all users for a site
     */
    public List<UserResponse> getUsersBySite(String siteId) {
        log.info("Fetching users for site: {}", siteId);
        // TODO: Filter by site when user_site_memberships is implemented
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all users (for admin/super admin)
     */
    public List<UserResponse> getAllUsers() {
        log.info("Fetching all users");
        return userRepository.findAll().stream()
                .map(user -> {
                    UserResponse response = toResponse(user);
                    // Get user roles
                    List<String> roles = userRepository.findRolesByUserId(user.getId());
                    response.setRoles(roles);
                    return response;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all users filtered by the current user's site
     */
    public List<UserResponse> getAllUsersBySite(String currentUserId) {
        log.info("Fetching all users for current user: {}", currentUserId);
        
        // Get current user's site memberships
        List<UserSiteMembership> currentUserMemberships = membershipRepository.findByUserId(currentUserId);
        
        if (currentUserMemberships.isEmpty()) {
            log.warn("User {} has no site memberships, returning empty list", currentUserId);
            return List.of();
        }
        
        // Get all site IDs the current user belongs to
        List<String> userSiteIds = currentUserMemberships.stream()
                .map(m -> m.getSite().getId())
                .collect(Collectors.toList());
        
        log.info("User {} belongs to sites: {}", currentUserId, userSiteIds);
        
        // Get all apartments for these sites
        List<Apartment> siteApartments = apartmentRepository.findBySiteIdIn(userSiteIds);
        
        // Get all user IDs that are assigned to apartments (either as resident or owner)
        Set<String> apartmentUserIds = new HashSet<>();
        for (Apartment apt : siteApartments) {
            if (apt.getCurrentResidentId() != null) {
                apartmentUserIds.add(apt.getCurrentResidentId());
            }
            if (apt.getOwnerUserId() != null) {
                apartmentUserIds.add(apt.getOwnerUserId());
            }
        }
        
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
        
        log.info("Found {} staff users in the same sites", staffUserIds.size());
        
        // Combine apartment users and staff users
        Set<String> allUserIds = new HashSet<>();
        allUserIds.addAll(apartmentUserIds);
        allUserIds.addAll(staffUserIds);
        
        // Remove current user from the list
        allUserIds.remove(currentUserId);
        
        log.info("Total users to return: {} (apartment: {}, staff: {})", 
                allUserIds.size(), apartmentUserIds.size(), staffUserIds.size());
        
        // Fetch users and map to response with apartment info
        // For users with multiple apartments, create separate entries for each apartment
        List<UserResponse> responses = new ArrayList<>();
        List<User> users = userRepository.findAllById(allUserIds);
        
        for (User user : users) {
            List<Apartment> userApartments = siteApartments.stream()
                    .filter(apt -> user.getId().equals(apt.getOwnerUserId()) || user.getId().equals(apt.getCurrentResidentId()))
                    .collect(Collectors.toList());
            
            if (userApartments.isEmpty()) {
                // User has no apartments (staff member), show without apartment info
                UserResponse response = toResponse(user);
                List<String> roles = userRepository.findRolesByUserId(user.getId());
                response.setRoles(roles);
                responses.add(response);
            } else {
                // Create separate response for each apartment
                for (Apartment apt : userApartments) {
                    UserResponse response = toResponse(user);
                    response.setBlockName(apt.getBlockName());
                    response.setUnitNumber(apt.getUnitNumber());
                    
                    boolean isOwner = user.getId().equals(apt.getOwnerUserId());
                    response.setResidentType(isOwner ? "owner" : "tenant");
                    
                    List<String> roles = userRepository.findRolesByUserId(user.getId());
                    response.setRoles(roles);
                    
                    responses.add(response);
                    log.info("User {} added for apartment {} as {}", user.getId(), apt.getUnitNumber(), response.getResidentType());
                }
            }
        }
        
        return responses;
    }
    
    /**
     * Get user by ID
     */
    public UserResponse getUserById(String userId) {
        log.info("Fetching user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        return toResponse(user);
    }
    
    /**
     * Get users by apartment ID with resident type
     */
    public List<UserResponse> getUsersByApartment(String apartmentId) {
        log.info("Fetching users for apartment: {}", apartmentId);
        
        // Get apartment info
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Daire", "id", apartmentId));
        
        // Get users from residency_history
        List<User> users = userRepository.findByApartmentId(apartmentId);
        
        return users.stream()
                .map(user -> {
                    UserResponse response = toResponse(user);
                    response.setApartmentId(apartmentId);
                    
                    // Get is_owner flag from residency_history
                    Boolean isOwner = userRepository.getIsOwnerByUserAndApartment(user.getId(), apartmentId);
                    response.setResidentType((isOwner != null && isOwner) ? "owner" : "tenant");
                    
                    // Get block name
                    if (apartment.getBlockId() != null) {
                        blockRepository.findById(apartment.getBlockId()).ifPresent(block -> {
                            response.setBlockName(block.getName());
                        });
                    }
                    response.setUnitNumber(apartment.getUnitNumber());
                    
                    log.info("User {} ({}) is {} in apartment {} ({})", 
                        user.getFullName(), user.getId(), response.getResidentType(), 
                        apartment.getUnitNumber(), apartmentId);
                    
                    return response;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Create new resident with full profile and apartment assignment
     */
    @Transactional
    public UserResponse createResident(com.sitedefteri.dto.request.CreateResidentRequest request, String createdBy) {
        log.info("Creating resident: {} for site: {}", request.getEmail(), request.getSiteId());
        
        try {
            // Check if user already exists
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new BadRequestException("Bu email adresi zaten kullanılıyor");
            }
            
            // Validate site exists
            Site site = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Site", "id", request.getSiteId()));
            
            // Find or create apartment
            String apartmentId = findOrCreateApartment(request.getBlockName(), request.getUnitNumber(), request.getSiteId());
            log.info("Apartment ID for resident: {}", apartmentId);
            
            // Create user
            User user = new User();
            user.setId(UUID.randomUUID().toString());
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            
            // Set password
            String password = request.getPassword() != null && !request.getPassword().trim().isEmpty() 
                ? request.getPassword() 
                : generateTempPassword();
            user.setPasswordHash(passwordEncoder.encode(password));
            
            // Set user status and verification
            user.setStatus(User.UserStatus.aktif); // Active immediately
            user.setEmailVerified(true); // Verified immediately
            user.setPhoneVerified(request.getPhone() != null);
            
            // Generate user QR token for package collection
            user.setUserQrToken(UUID.randomUUID().toString());
            
            User savedUser = userRepository.save(user);
            log.info("User created successfully: {}", savedUser.getId());
            
            // Create site membership with resident role
            UserSiteMembership membership = new UserSiteMembership();
            membership.setId(UUID.randomUUID().toString());
            membership.setUser(savedUser);
            membership.setSite(site);
            membership.setRoleType("RESIDENT"); // Resident role
            membership.setIsDeleted(false);
            
            membershipRepository.save(membership);
            log.info("Site membership created for user: {} with role: RESIDENT", savedUser.getId());
            
            // Assign apartment
            try {
                assignApartmentToUser(savedUser.getId(), apartmentId, request.getResidentType());
                log.info("Apartment assigned successfully");
            } catch (Exception e) {
                log.error("Error assigning apartment: {}", e.getMessage());
                throw new BadRequestException("Daire atama hatası: " + e.getMessage());
            }
            
            // Create residency history record
            try {
                createResidencyHistory(savedUser.getId(), apartmentId, "owner".equals(request.getResidentType()));
                log.info("Residency history created successfully");
            } catch (Exception e) {
                log.error("Error creating residency history: {}", e.getMessage());
                // Don't fail the whole operation for this
            }
            
            log.info("Resident created successfully: {} assigned to apartment: {}", savedUser.getId(), apartmentId);
            
            return toResponse(savedUser);
            
        } catch (BadRequestException | ResourceNotFoundException e) {
            log.error("Business logic error in createResident: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in createResident: {}", e.getMessage(), e);
            throw new RuntimeException("Sakin oluşturulurken beklenmeyen bir hata oluştu: " + e.getMessage());
        }
    }
    
    /**
     * Find existing apartment or create new one
     */
    private String findOrCreateApartment(String blockName, String unitNumber, String siteId) {
        log.info("Looking for apartment: blockName={}, unitNumber={}, siteId={}", blockName, unitNumber, siteId);
        
        // First try to find existing apartment by site_id and unit_number
        List<Apartment> existingApartments = apartmentRepository.findBySiteId(siteId);
        log.info("Found {} apartments in site {}", existingApartments.size(), siteId);
        
        for (Apartment apt : existingApartments) {
            log.info("Checking apartment: id={}, unitNumber={}, blockName={}, siteId={}", 
                    apt.getId(), apt.getUnitNumber(), apt.getBlockName(), apt.getSiteId());
            if (apt.getUnitNumber() != null && apt.getUnitNumber().equals(unitNumber)) {
                log.info("Found existing apartment: {} {} in site: {} (ID: {})", apt.getBlockName(), unitNumber, siteId, apt.getId());
                return apt.getId();
            }
        }
        
        // If not found, create new apartment
        log.info("No existing apartment found, creating new apartment: {} {} in site: {}", blockName, unitNumber, siteId);
        
        // Find or create block
        String blockId = findOrCreateBlock(blockName, siteId);
        
        // Create apartment
        Apartment apartment = new Apartment();
        apartment.setId(UUID.randomUUID().toString());
        apartment.setBlockId(blockId);
        apartment.setBlockName(blockName);
        apartment.setUnitNumber(unitNumber);
        apartment.setFloor(calculateFloor(unitNumber));
        apartment.setStatus(Apartment.ApartmentStatus.dolu);
        apartment.setSiteId(siteId);
        
        try {
            Apartment savedApartment = apartmentRepository.save(apartment);
            log.info("New apartment created: {}", savedApartment.getId());
            return savedApartment.getId();
        } catch (Exception e) {
            // If apartment creation fails due to constraint violation, try to find it again
            log.warn("Apartment creation failed, trying to find existing apartment: {}", e.getMessage());
            List<Apartment> retryApartments = apartmentRepository.findBySiteId(siteId);
            for (Apartment apt : retryApartments) {
                if (apt.getUnitNumber() != null && apt.getUnitNumber().equals(unitNumber)) {
                    log.info("Found existing apartment after retry: {} {} in site: {} (ID: {})", apt.getBlockName(), unitNumber, siteId, apt.getId());
                    return apt.getId();
                }
            }
            throw new RuntimeException("Daire bulunamadı ve oluşturulamadı: " + e.getMessage());
        }
    }
    
    /**
     * Find existing block or create new one
     */
    private String findOrCreateBlock(String blockName, String siteId) {
        // Try to find existing block
        List<com.sitedefteri.entity.Block> blocks = blockRepository.findAll();
        for (com.sitedefteri.entity.Block block : blocks) {
            if (block.getName() != null && block.getName().equals(blockName) && 
                block.getSiteId() != null && block.getSiteId().equals(siteId)) {
                log.info("Found existing block: {}", blockName);
                return block.getId();
            }
        }
        
        // Create new block
        log.info("Creating new block: {}", blockName);
        com.sitedefteri.entity.Block block = new com.sitedefteri.entity.Block();
        block.setId(UUID.randomUUID().toString());
        block.setName(blockName);
        block.setSiteId(siteId);
        block.setDescription(blockName + " bloku");
        
        com.sitedefteri.entity.Block savedBlock = blockRepository.save(block);
        log.info("New block created: {}", savedBlock.getId());
        
        return savedBlock.getId();
    }
    
    /**
     * Calculate floor from unit number
     */
    private Integer calculateFloor(String unitNumber) {
        try {
            int unit = Integer.parseInt(unitNumber);
            // Simple calculation: every 10 units = 1 floor
            return (unit - 1) / 10 + 1;
        } catch (NumberFormatException e) {
            return 1; // Default to ground floor
        }
    }
    
    /**
     * Create residency history record
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void createResidencyHistory(String userId, String apartmentId, boolean isOwner) {
        String sql = "INSERT INTO residency_history (id, user_id, apartment_id, move_in_date, is_owner, status, is_deleted) " +
                    "VALUES (?, ?, ?, NOW(), ?, 'active', false)";
        
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, UUID.randomUUID().toString());
            query.setParameter(2, userId);
            query.setParameter(3, apartmentId);
            query.setParameter(4, isOwner);
            
            query.executeUpdate();
            log.info("Residency history created for user: {} in apartment: {}", userId, apartmentId);
        } catch (Exception e) {
            log.error("Error creating residency history: {}", e.getMessage());
            // Don't fail the whole operation for this
        }
    }
    
    /**
     * Invite new user
     */
    @Transactional
    public UserResponse inviteUser(InviteUserRequest request, String invitedBy) {
        log.info("Inviting user: {} to site: {}", request.getEmail(), request.getSiteId());
        
        // Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Bu email adresi zaten kullanılıyor");
        }
        
        // Create user with temporary password
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        
        // Generate or use provided password
        String password;
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            password = request.getPassword(); // Use provided password
        } else {
            password = generateTempPassword(); // Generate temp password
        }
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setStatus(User.UserStatus.dogrulama_bekliyor);
        user.setEmailVerified(false);
        user.setPhoneVerified(false);
        
        // Generate user QR token for package collection
        user.setUserQrToken(UUID.randomUUID().toString());
        log.info("User QR token generated for user: {}", user.getEmail());
        
        User saved = userRepository.save(user);
        
        // Create user site membership with admin role
        if (request.getSiteId() != null) {
            Site site = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Site", "id", request.getSiteId()));
            
            UserSiteMembership membership = new UserSiteMembership();
            membership.setId(UUID.randomUUID().toString());
            membership.setUser(saved);
            membership.setSite(site);
            membership.setRoleType("yonetici"); // Admin role
            membership.setIsDeleted(false);
            
            membershipRepository.save(membership);
            log.info("User site membership created for user: {} with role: yonetici", saved.getId());
        }
        
        // TODO: Send invitation email/SMS with temp password
        log.info("User invited successfully: {}", saved.getId());
        
        // If apartment assigned, update apartment
        if (request.getApartmentId() != null) {
            assignApartmentToUser(saved.getId(), request.getApartmentId(), "resident");
        }
        
        return toResponse(saved);
    }
    
    /**
     * Update user
     */
    @Transactional
    public UserResponse updateUser(String userId, UpdateUserRequest request) {
        log.info("Updating user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            // Check if email is already taken
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new BadRequestException("Bu email adresi zaten kullanılıyor");
            }
            user.setEmail(request.getEmail());
            user.setEmailVerified(false);
        }
        
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        
        if (request.getProfilePhotoUrl() != null) {
            user.setProfilePhotoUrl(request.getProfilePhotoUrl());
        }
        
        if (request.getStatus() != null) {
            user.setStatus(User.UserStatus.valueOf(request.getStatus()));
        }
        
        if (request.getPreferredLanguage() != null) {
            user.setPreferredLanguage(request.getPreferredLanguage());
        }
        
        User updated = userRepository.save(user);
        log.info("User updated successfully: {}", userId);
        
        return toResponse(updated);
    }
    
    /**
     * Assign apartment to user
     */
    @Transactional
    public UserResponse assignApartment(String userId, AssignApartmentRequest request) {
        log.info("Assigning apartment {} to user {}", request.getApartmentId(), userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        assignApartmentToUser(userId, request.getApartmentId(), request.getAssignmentType());
        
        return toResponse(user);
    }
    
    /**
     * Delete user (soft delete)
     */
    @Transactional
    public void deleteUser(String userId) {
        log.info("Deleting user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        user.setStatus(User.UserStatus.yasakli);
        userRepository.save(user);
        
        log.info("User deleted (soft) successfully: {}", userId);
    }
    
    /**
     * Helper: Assign apartment to user
     */
    private void assignApartmentToUser(String userId, String apartmentId, String assignmentType) {
        log.info("Assigning apartment {} to user {} as {}", apartmentId, userId, assignmentType);
        
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Daire", "id", apartmentId));
        
        log.info("Current apartment state - Owner: {}, Current Resident: {}", 
                apartment.getOwnerUserId(), apartment.getCurrentResidentId());
        
        // More flexible assignment logic - allow adding tenants to owner-only apartments and vice versa
        if ("owner".equals(assignmentType)) {
            if (apartment.getOwnerUserId() != null && !apartment.getOwnerUserId().equals(userId)) {
                throw new BadRequestException("Bu dairede zaten bir ev sahibi var (ID: " + apartment.getOwnerUserId() + ")");
            }
            apartment.setOwnerUserId(userId);
            apartment.setStatus(Apartment.ApartmentStatus.dolu);
        } else {
            if (apartment.getCurrentResidentId() != null && !apartment.getCurrentResidentId().equals(userId)) {
                throw new BadRequestException("Bu dairede zaten bir kiracı var (ID: " + apartment.getCurrentResidentId() + ")");
            }
            apartment.setCurrentResidentId(userId);
            apartment.setStatus(Apartment.ApartmentStatus.dolu);
        }
        
        apartmentRepository.save(apartment);
        log.info("Apartment {} assigned to user {} as {} successfully", apartmentId, userId, assignmentType);
    }
    
    /**
     * Remove resident from apartment
     */
    @Transactional
    public void removeResidentFromApartment(String userId, String apartmentId) {
        log.info("Removing user {} from apartment {}", userId, apartmentId);
        
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Daire", "id", apartmentId));
        
        boolean removed = false;
        
        // Check if user is the owner
        if (userId.equals(apartment.getOwnerUserId())) {
            apartment.setOwnerUserId(null);
            removed = true;
            log.info("Removed owner from apartment {}", apartmentId);
        }
        
        // Check if user is the current resident
        if (userId.equals(apartment.getCurrentResidentId())) {
            apartment.setCurrentResidentId(null);
            removed = true;
            log.info("Removed resident from apartment {}", apartmentId);
        }
        
        if (!removed) {
            throw new BadRequestException("Kullanıcı bu dairede kayıtlı değil");
        }
        
        // Update apartment status if both owner and resident are removed
        if (apartment.getOwnerUserId() == null && apartment.getCurrentResidentId() == null) {
            apartment.setStatus(Apartment.ApartmentStatus.bos);
            log.info("Apartment {} is now empty", apartmentId);
        }
        
        apartmentRepository.save(apartment);
        log.info("User {} successfully removed from apartment {}", userId, apartmentId);
    }
    
    /**
     * Change user's apartment (remove from old, assign to new)
     */
    @Transactional
    public UserResponse changeApartment(String userId, String newApartmentId, String assignmentType) {
        log.info("Changing apartment for user {} to apartment {}", userId, newApartmentId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        // Find and remove from old apartment
        List<Apartment> allApartments = apartmentRepository.findAll();
        for (Apartment apt : allApartments) {
            if (userId.equals(apt.getOwnerUserId())) {
                apt.setOwnerUserId(null);
                if (apt.getCurrentResidentId() == null) {
                    apt.setStatus(Apartment.ApartmentStatus.bos);
                }
                apartmentRepository.save(apt);
                log.info("Removed user from old apartment {} as owner", apt.getId());
            }
            if (userId.equals(apt.getCurrentResidentId())) {
                apt.setCurrentResidentId(null);
                if (apt.getOwnerUserId() == null) {
                    apt.setStatus(Apartment.ApartmentStatus.bos);
                }
                apartmentRepository.save(apt);
                log.info("Removed user from old apartment {} as resident", apt.getId());
            }
        }
        
        // Assign to new apartment
        assignApartmentToUser(userId, newApartmentId, assignmentType);
        
        log.info("User {} successfully moved to apartment {}", userId, newApartmentId);
        return toResponse(user);
    }
    
    /**
     * Helper: Generate temporary password
     */
    private String generateTempPassword() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    /**
     * Convert entity to response
     */
    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUserId(user.getId()); // Alias for mobile compatibility
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setProfilePhotoUrl(user.getProfilePhotoUrl());
        response.setStatus(user.getStatus().name());
        response.setEmailVerified(user.getEmailVerified());
        response.setPhoneVerified(user.getPhoneVerified());
        response.setPreferredLanguage(user.getPreferredLanguage());
        response.setCreatedAt(user.getCreatedAt());
        // Note: role and siteId should be set by caller if needed (from UserSiteMembership)
        return response;
    }
    
    /**
     * Convert entity to response with apartment information
     */
    private UserResponse toResponseWithApartment(User user) {
        UserResponse response = toResponse(user);
        
        // Find apartment where user is owner or resident
        List<Apartment> apartments = apartmentRepository.findAll();
        for (Apartment apt : apartments) {
            boolean isOwner = user.getId().equals(apt.getOwnerUserId());
            boolean isResident = user.getId().equals(apt.getCurrentResidentId());
            
            if (isOwner || isResident) {
                response.setBlockName(apt.getBlockName());
                response.setUnitNumber(apt.getUnitNumber());
                response.setResidentType(isOwner ? "owner" : "tenant");
                log.info("User {} found in apartment {} as {}", user.getId(), apt.getUnitNumber(), response.getResidentType());
                break; // Kullanıcı sadece bir dairede olabilir
            }
        }
        
        return response;
    }
    
    /**
     * Save FCM token for push notifications
     */
    @Transactional
    public void saveFcmToken(String userId, String fcmToken) {
        if ("anonymous".equals(userId)) {
            log.info("Anonymous user sent FCM token, ignoring: {}", fcmToken);
            return;
        }
        
        log.info("Saving FCM token for user: {}", userId);
        
        userRepository.findById(userId).ifPresent(user -> {
            user.setFcmToken(fcmToken);
            userRepository.save(user);
            log.info("FCM Token successfully saved for user: {}", userId);
        });
    }
    
    /**
     * Update user's preferred language
     * Supported languages: tr, en, ru, ar
     */
    @Transactional
    public void updateUserLanguage(String userId, String language) {
        log.info("Updating language for user: {} to: {}", userId, language);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        // Validate language
        if (!List.of("tr", "en", "ru", "ar").contains(language)) {
            throw new BadRequestException("Geçersiz dil. Desteklenen diller: tr, en, ru, ar");
        }
        
        user.setPreferredLanguage(language);
        userRepository.save(user);
        
        log.info("Language updated successfully for user: {}", userId);
    }
    /**
     * Change user password
     */
    @Transactional
    public void changePassword(String userId, String currentPassword, String newPassword) {
        log.info("Changing password for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Mevcut şifre yanlış");
        }
        
        // Encode and set new password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        log.info("Password changed successfully for user: {}", userId);
    }

    
    /**
     * Get user's preferred language
     */
    public String getUserLanguage(String userId) {
        log.info("Fetching language for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        String language = user.getPreferredLanguage();
        return language != null ? language : "tr"; // Default to Turkish
    }
    
    /**
     * Get user's QR token for package collection
     */
    public String getUserQRToken(String userId) {
        log.info("Fetching QR token for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        // Generate QR token if not exists
        if (user.getUserQrToken() == null) {
            user.setUserQrToken(UUID.randomUUID().toString());
            userRepository.save(user);
            log.info("Generated new QR token for user: {}", userId);
        }
        
        return user.getUserQrToken();
    }
    
    /**
     * Find user by QR token
     */
    public User findByQRToken(String qrToken) {
        log.info("Finding user by QR token");
        return userRepository.findByUserQrToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "QR token", qrToken));
    }
    
    /**
     * Get all apartments for a user
     */
    public List<java.util.Map<String, Object>> getUserApartments(String userId) {
        log.info("Fetching apartments for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        // Query residency_history to get all active apartments for this user
        String sql = "SELECT a.id, a.unit_number, b.name as block_name, b.id as block_id, " +
                    "a.floor, rh.is_owner " +
                    "FROM apartments a " +
                    "JOIN blocks b ON a.block_id = b.id " +
                    "JOIN residency_history rh ON a.id = rh.apartment_id " +
                    "WHERE rh.user_id = :userId AND rh.status = 'active' AND rh.is_deleted = false";
        
        List<java.util.Map<String, Object>> results = new java.util.ArrayList<>();
        
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("userId", userId);
            
            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();
            
            for (Object[] row : rows) {
                java.util.Map<String, Object> apartmentInfo = new java.util.HashMap<>();
                apartmentInfo.put("id", row[0]);
                apartmentInfo.put("unitNumber", row[1]);
                apartmentInfo.put("blockName", row[2]);
                apartmentInfo.put("blockId", row[3]);
                apartmentInfo.put("floor", row[4]);
                apartmentInfo.put("assignmentType", (Boolean) row[5] ? "OWNER" : "TENANT");
                results.add(apartmentInfo);
            }
        } catch (Exception e) {
            log.error("Error fetching user apartments: {}", e.getMessage());
            throw new RuntimeException("Daireler yüklenirken hata oluştu", e);
        }
        
        return results;
    }
    
    /**
     * Switch user's active apartment
     * Note: This just verifies access. The frontend will handle the apartment context.
     */
    @Transactional
    public UserResponse switchUserApartment(String userId, String apartmentId) {
        log.info("Switching apartment for user {} to apartment {}", userId, apartmentId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Daire", "id", apartmentId));
        
        // Verify user has access to this apartment through residency_history
        String checkSql = "SELECT COUNT(*) FROM residency_history " +
                         "WHERE user_id = :userId AND apartment_id = :apartmentId " +
                         "AND status = 'active' AND is_deleted = false";
        
        jakarta.persistence.Query checkQuery = entityManager.createNativeQuery(checkSql);
        checkQuery.setParameter("userId", userId);
        checkQuery.setParameter("apartmentId", apartmentId);
        
        Number count = (Number) checkQuery.getSingleResult();
        
        if (count.intValue() == 0) {
            throw new BadRequestException("Bu daireye erişim yetkiniz yok");
        }
        
        log.info("Successfully verified user {} has access to apartment {}", userId, apartmentId);
        
        // Return user response with apartment info
        UserResponse response = toResponse(user);
        response.setApartmentId(apartmentId);
        
        return response;
    }
}
