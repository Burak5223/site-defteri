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
import com.sitedefteri.repository.SiteRepository;
import com.sitedefteri.repository.UserRepository;
import com.sitedefteri.repository.UserSiteMembershipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserSiteMembershipRepository membershipRepository;
    private final SiteRepository siteRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsService smsService;
    
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
        
        // Get all memberships for these sites
        List<UserSiteMembership> siteMemberships = membershipRepository.findBySiteIdIn(userSiteIds);
        
        // Get unique user IDs from these memberships (excluding current user)
        List<String> siteUserIds = siteMemberships.stream()
                .map(m -> m.getUser().getId())
                .filter(id -> !id.equals(currentUserId))
                .distinct()
                .collect(Collectors.toList());
        
        log.info("Found {} users in the same sites", siteUserIds.size());
        
        // Fetch users and map to response
        return userRepository.findAllById(siteUserIds).stream()
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
     * Get user by ID
     */
    public UserResponse getUserById(String userId) {
        log.info("Fetching user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        return toResponse(user);
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
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Daire", "id", apartmentId));
        
        // Validate: Check if apartment already has both owner and tenant
        if ("owner".equals(assignmentType)) {
            if (apartment.getOwnerUserId() != null) {
                throw new BadRequestException("Bu dairede zaten bir ev sahibi var");
            }
            apartment.setOwnerUserId(userId);
            apartment.setStatus(Apartment.ApartmentStatus.dolu);
        } else {
            if (apartment.getCurrentResidentId() != null) {
                throw new BadRequestException("Bu dairede zaten bir kiracı var");
            }
            apartment.setCurrentResidentId(userId);
            apartment.setStatus(Apartment.ApartmentStatus.dolu);
        }
        
        apartmentRepository.save(apartment);
        log.info("Apartment {} assigned to user {} as {}", apartmentId, userId, assignmentType);
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
}
