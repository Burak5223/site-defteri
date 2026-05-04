import { apiClient } from '../api/apiClient';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'acik' | 'devam_ediyor' | 'cozuldu' | 'kapali';
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

class TicketService {
  async getAllTickets(siteId: string = '1'): Promise<Ticket[]> {
    return apiClient.get(`/sites/${siteId}/tickets`);
  }

  async getTickets(siteId: string = '1'): Promise<Ticket[]> {
    return apiClient.get(`/sites/${siteId}/tickets`);
  }

  async getTicketsBySite(siteId: string): Promise<Ticket[]> {
    return apiClient.get(`/sites/${siteId}/tickets`);
  }

  async getMyTickets(): Promise<Ticket[]> {
    return apiClient.get('/tickets/my');
  }

  async createTicket(data: CreateTicketRequest, siteId: string = '1'): Promise<Ticket> {
    return apiClient.post(`/sites/${siteId}/tickets`, data);
  }

  async updateTicketStatus(id: string, status: string, siteId?: string): Promise<void> {
    // If siteId not provided, use default '1' or get from context
    const site = siteId || '1';
    return apiClient.put(`/sites/${site}/tickets/${id}/status`, { status });
  }
}

export const ticketService = new TicketService();
