import { apiClient } from '../api/apiClient';

export interface VotingOption {
  id: string;
  label: string;
  votes: number;
}

export interface Voting {
  id: string;
  siteId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'ended';
  options: VotingOption[];
  totalVotes: number;
  userVotedInfo?: {
    hasVoted: boolean;
    selectedOptionId?: string;
  };
  createdAt: string;
}

export interface CreateVotingRequest {
  siteId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  options: string[]; // List of option labels
}

export class GovernanceService {
  // Get votings list
  async getVotings(siteId: string): Promise<Voting[]> {
    return apiClient.get(`/sites/${siteId}/votings`);
  }

  // Get voting details
  async getVotingDetails(siteId: string, votingId: string): Promise<Voting> {
    return apiClient.get(`/sites/${siteId}/votings/${votingId}`);
  }

  // Cast vote
  async castVote(siteId: string, votingId: string, optionId: string): Promise<void> {
    return apiClient.post(`/sites/${siteId}/votings/${votingId}/vote`, { optionId });
  }

  // Create voting (Admin)
  async createVoting(data: CreateVotingRequest): Promise<Voting> {
    return apiClient.post(`/sites/${data.siteId}/votings`, data);
  }
}

export const governanceService = new GovernanceService();
