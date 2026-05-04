import { apiClient } from '../api/apiClient';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  receiverId?: string;
  receiverName?: string;
  receiverRole?: string;
  apartmentId?: string;
  apartmentNumber?: string;
  chatType?: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface Contact {
  userId: string;
  fullName: string;
  role: string;
  apartmentInfo?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface SendMessageRequest {
  siteId: string;
  receiverId?: string;
  apartmentId?: string;
  chatType: string; // 'group', 'security', 'direct', 'apartment'
  body: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

class MessageService {
  async getMessages(siteId: string = '1'): Promise<Message[]> {
    return apiClient.get(`/sites/${siteId}/messages`);
  }

  async sendMessage(data: SendMessageRequest): Promise<Message> {
    return apiClient.post('/messages', data);
  }

  // NEW: Get contacts list
  async getContacts(siteId: string): Promise<Contact[]> {
    return apiClient.get(`/sites/${siteId}/contacts`);
  }

  // NEW: Get conversation with a specific user
  async getConversation(siteId: string, userId: string): Promise<Message[]> {
    return apiClient.get(`/sites/${siteId}/messages/conversation/${userId}`);
  }

  // NEW: Send direct message
  async sendDirectMessage(siteId: string, receiverId: string, content: string): Promise<Message> {
    return apiClient.post(`/sites/${siteId}/messages/send`, { receiverId, content });
  }

  // NEW: Mark conversation as read
  async markConversationAsRead(siteId: string, userId: string): Promise<void> {
    return apiClient.put(`/sites/${siteId}/messages/conversation/${userId}/mark-read`);
  }

  async markAsRead(id: string): Promise<void> {
    return apiClient.put(`/messages/${id}/read`);
  }

  async deleteMessage(id: string): Promise<void> {
    return apiClient.delete(`/messages/${id}`);
  }

  // NEW: Get messages with Super Admin
  async getSuperAdminMessages(siteId: string): Promise<Message[]> {
    return apiClient.get(`/sites/${siteId}/messages/super-admin`);
  }

  // NEW: Send message to Super Admin
  async sendMessageToSuperAdmin(siteId: string, content: string): Promise<Message> {
    return apiClient.post(`/sites/${siteId}/messages/super-admin`, { content });
  }

  async getApartmentMessages(siteId: string, apartmentId: string): Promise<Message[]> {
    return apiClient.get(`/sites/${siteId}/apartments/${apartmentId}/messages`);
  }

  // NEW: Get apartments list for messaging
  async getApartments(siteId: string): Promise<any[]> {
    return apiClient.get(`/sites/${siteId}/messages/apartments`);
  }

  // NEW: Get all my messages (for unread count)
  async getMyMessages(): Promise<Message[]> {
    return apiClient.get('/messages');
  }
}

export const messageService = new MessageService();
