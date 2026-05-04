// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  roles: string[];
  siteId: string;
  tokenType?: string;
  permissions?: string[];
  user: {
    fullName: string;
    phone?: string;
    siteId?: string;
    email?: string;
    apartmentId?: string;
  };
}

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  phone: string;
  roles: string[];
  siteId: string;
  siteName?: string;
  apartmentId?: string;
}

// User Types
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[];
  siteId: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface InviteUserRequest {
  email: string;
  role: string;
  apartmentId?: string;
}

// Site Types
export interface SiteResponse {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface CreateSiteRequest {
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface UpdateSiteRequest {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
}

// Block Types
export interface BlockResponse {
  id: string;
  name: string;
  siteId: string;
}

export interface CreateBlockRequest {
  name: string;
  siteId: string;
}

// Apartment Types
export interface ApartmentResponse {
  id: string;
  number: string;
  blockId: string;
  floor: number;
}

export interface CreateApartmentRequest {
  number: string;
  blockId: string;
  floor: number;
}
