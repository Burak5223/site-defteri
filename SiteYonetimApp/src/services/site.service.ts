import { apiClient } from '../api/apiClient';

export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  country?: string;
  totalApartments: number;
  totalResidents: number;
  status: string;
  createdAt: string;
}

export interface Block {
  id: string;
  name: string;
  siteId: string;
  totalApartments: number;
  totalOwners?: number;
  totalTenants?: number;
  totalResidents?: number;
}

export interface CreateSiteRequest {
  name: string;
  address: string;
  city: string;
  country?: string;
  currency?: string;
  timezone?: string;
}

export interface UpdateSiteRequest {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface CreateBlockRequest {
  name: string;
  totalFloors: number;
  description?: string;
}

export interface CreateApartmentRequest {
  unitNumber: string;
  floor: number;
}

class SiteService {
  async getSites(): Promise<Site[]> {
    return apiClient.get('/sites');
  }

  async getSiteById(id: string): Promise<Site> {
    return apiClient.get(`/sites/${id}`);
  }

  async createSite(data: CreateSiteRequest): Promise<Site> {
    return apiClient.post('/sites', data);
  }

  async updateSite(id: string, data: UpdateSiteRequest): Promise<Site> {
    return apiClient.put(`/sites/${id}`, data);
  }

  async deleteSite(id: string): Promise<void> {
    return apiClient.delete(`/sites/${id}`);
  }

  async getSiteBlocks(siteId: string): Promise<Block[]> {
    return apiClient.get(`/sites/${siteId}/blocks`);
  }

  async createBlock(siteId: string, data: CreateBlockRequest): Promise<Block> {
    return apiClient.post(`/sites/${siteId}/blocks`, data);
  }

  async updateBlock(siteId: string, blockId: string, data: CreateBlockRequest): Promise<Block> {
    return apiClient.put(`/sites/${siteId}/blocks/${blockId}`, data);
  }

  async deleteBlock(blockId: string): Promise<void> {
    return apiClient.delete(`/blocks/${blockId}`);
  }

  async createApartment(blockId: string, data: CreateApartmentRequest): Promise<any> {
    return apiClient.post(`/blocks/${blockId}/apartments`, data);
  }

  async deleteApartment(apartmentId: string): Promise<void> {
    return apiClient.delete(`/apartments/${apartmentId}`);
  }
}

export const siteService = new SiteService();
