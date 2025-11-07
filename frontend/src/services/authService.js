// services/authService.js - Fixed with consistent token handling
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api/auth';
    this.TOKEN_KEY = 'token'; // CONSISTENT KEY
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.detail || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('Auth request error:', error);
      throw error;
    }
  }

  async login(email, password) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store BOTH tokens with consistent key
    if (response.token) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      localStorage.setItem('refreshToken', response.refresh_token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store tokens
    if (response.token) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      localStorage.setItem('refreshToken', response.refresh_token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/logout', {
        method: 'POST',
      });
    } finally {
      // Always clear local storage
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('refreshToken');
    }
  }

  async verifyToken() {
    return this.request('/verify');
  }

  async updateProfile(profileData) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Token refresh failed');
      }

      // Update tokens
      localStorage.setItem(this.TOKEN_KEY, data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      
      return data;
    } catch (error) {
      // If refresh fails, logout
      this.logout();
      throw error;
    }
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

// Export the service instance
export const authService = new AuthService();