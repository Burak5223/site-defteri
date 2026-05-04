/**
 * Block Service
 * Handles all block-related API calls
 */

import { apiClient } from '../api/apiClient';
import type {
  BlockResponse,
  CreateBlockRequest,
} from '../types';

export class BlockService {
  /**
   * Create new block
   * POST /api/v1/blocks
   */
  async createBlock(data: CreateBlockRequest): Promise<BlockResponse> {
    return apiClient.post<BlockResponse>('/blocks', data);
  }
}

// Export singleton instance
export const blockService = new BlockService();

