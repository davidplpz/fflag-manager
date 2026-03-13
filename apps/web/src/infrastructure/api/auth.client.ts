import { apiClient } from './api-client';

export interface LoginCredentials {
  email: string;
  password?: string; // Optional for flexibility if the backend supports passwordless or we just use email
}

export interface AuthResponse {
  token: string;
}

export const AuthClient = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // We send the login request to the backend. It's assumed the backend will provide this at /auth/login.
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Optionally hit a backend endpoint for logout, otherwise just clear local client state
    try {
       await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore if it fails, we still want to clear local storage
      console.warn('Backend logout failed or not implemented', e);
    }
  }
};
