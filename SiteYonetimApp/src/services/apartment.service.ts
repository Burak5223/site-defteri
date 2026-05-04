/**
 * Apartment Service
 * Handles all apartment-related API calls
 */

import { apiClient } from '../api/apiClient';
import type {
  ApartmentResponse,
  CreateApartmentRequest,
} from '../types';

export class ApartmentService {
  /**
   * Create new apartment
   * POST /api/v1/apartments
   */
  async createApartment(data: CreateApartmentRequest): Promise<ApartmentResponse> {
    return apiClient.post<ApartmentResponse>('/apartments', data);
  }
}

// Export singleton instance
export const apartmentService = new ApartmentService();

