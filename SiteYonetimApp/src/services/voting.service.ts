import { apiClient } from '../api/apiClient';

export interface VotingOption {
  id: string;
  optionText: string;
  displayOrder: number;
  voteCount: number;
  percentage: number;
}

export interface Voting {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'ended' | 'upcoming';
  createdBy: string;
  createdAt: string;
  options: VotingOption[];
  totalVotes: number;
  hasVoted: boolean;
  userVotedOptionId?: string;
}

export interface CreateVotingRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  options: string[];
}

export interface CastVoteRequest {
  votingId: string;
  optionId: string;
}

class VotingService {
  async getVotings(siteId: string): Promise<Voting[]> {
    return apiClient.get(`/sites/${siteId}/e-voting`);
  }

  async getVotingById(id: string): Promise<Voting> {
    return apiClient.get(`/e-voting/${id}`);
  }

  async createVoting(data: CreateVotingRequest, siteId: string): Promise<Voting> {
    return apiClient.post(`/sites/${siteId}/e-voting`, data);
  }

  async castVote(data: CastVoteRequest): Promise<Voting> {
    return apiClient.post('/e-voting/vote', data);
  }

  // Backward compatibility - VotingScreen kullanıyor
  async getVotingTopics(siteId: string): Promise<Voting[]> {
    return this.getVotings(siteId);
  }
}

export const votingService = new VotingService();
