import { apiClient } from './api-client';

export interface Strategy {
  type: 'percentage' | 'user-based' | 'time-based' | 'composite';
  rolloutPercentage?: number;
  whitelist?: string[];
  startTime?: string;
  endTime?: string;
  strategies?: Strategy[];
  operator?: 'AND' | 'OR';
}

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  strategy?: Strategy;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlagDto {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  strategy?: Strategy;
}

export interface UpdateFlagDto extends Partial<CreateFlagDto> {}

export const flagsService = {
  getFlags: async () => {
    const response = await apiClient.get<FeatureFlag[]>('/feature-flags');
    return response.data;
  },

  getFlag: async (key: string) => {
    const response = await apiClient.get<FeatureFlag>(`/feature-flags/${key}`);
    return response.data;
  },

  createFlag: async (data: CreateFlagDto) => {
    const response = await apiClient.post<FeatureFlag>('/feature-flags', data);
    return response.data;
  },

  updateFlag: async (key: string, data: UpdateFlagDto) => {
    const response = await apiClient.put<FeatureFlag>(`/feature-flags/${key}`, data);
    return response.data;
  },

  deleteFlag: async (key: string) => {
    await apiClient.delete(`/feature-flags/${key}`);
  },

  evaluateFlag: async (key: string, context: { userId?: string; attributes?: Record<string, any> }) => {
    const response = await apiClient.post<{ enabled: boolean }>(`/feature-flags/${key}/evaluate`, context);
    return response.data;
  },
};
