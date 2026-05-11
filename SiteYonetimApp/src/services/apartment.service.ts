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
   * POST /api/blocks/{blockId}/apartments
   */
  async createApartment(data: CreateApartmentRequest): Promise<ApartmentResponse> {
    return apiClient.post<ApartmentResponse>(`/blocks/${data.blockId}/apartments`, {
      unitNumber: data.unitNumber,
      floor: data.floor
    });
  }

  /**
   * Delete apartment
   * DELETE /api/blocks/{blockId}/apartments/{id}
   */
  async deleteApartment(blockId: string, apartmentId: string): Promise<void> {
    return apiClient.delete(`/blocks/${blockId}/apartments/${apartmentId}`);
  }
}

// Export singleton instance
export const apartmentService = new ApartmentService();

