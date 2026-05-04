/**
 * Communication Service
 * Handles messages and conversations
 */

import { apiClient } from '../api/apiClient';

export interface Message {
  id: string;
  siteId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId?: string;
  chatType: string; // 'group' | 'security' | 'direct'
  body: string;
  isRead: boolean;
  readAt?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
}

export interface CreateMessageRequest {
  siteId: string;
  receiverId?: string;
  chatType: string;
  body: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export class CommunicationService {
  // Send a message
  async sendMessage(data: CreateMessageRequest): Promise<Message> {
    return apiClient.post('/messages', data);
  }

  // Get group messages for a site
  async getGroupMessages(siteId: string): Promise<Message[]> {
    return apiClient.get(`/sites/${siteId}/messages/group`);
  }

  // Get my security messages
  async getMySecurityMessages(siteId: string): Promise<Message[]> {
    return apiClient.get(`/sites/${siteId}/messages/security`);
  }

  // Get security messages with specific user
  async getSecurityMessages(siteId: string, otherUserId: string): Promise<Message[]> {
    return apiClient.get(`/sites/${siteId}/messages/security/${otherUserId}`);
  }

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    return apiClient.put(`/messages/${messageId}/read`, {});
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    return apiClient.get('/messages/unread-count');
  }
}

export const communicationService = new CommunicationService();

