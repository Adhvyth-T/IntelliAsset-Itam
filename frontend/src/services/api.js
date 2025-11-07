// services/api.js - Complete API Service with Token Management
import { authService } from './authService';

const API_BASE = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  async request(url, options = {}) {
    const token = authService.getToken(); // Use authService's getToken method
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      let response = await fetch(`${API_BASE}${url}`, config);

      // Handle 401/403 - try to refresh token once
      if ((response.status === 401 || response.status === 403) && token) {
        console.log('Token might be expired, attempting refresh...');
        
        // Prevent multiple simultaneous refresh attempts
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          this.refreshPromise = authService.refreshToken()
            .then(() => {
              this.isRefreshing = false;
              return true;
            })
            .catch((error) => {
              this.isRefreshing = false;
              console.error('Token refresh failed:', error);
              // Redirect to login or handle as needed
              window.location.href = '/login';
              return false;
            });
        }

        // Wait for refresh to complete
        const refreshed = await this.refreshPromise;
        
        if (refreshed) {
          // Retry the original request with new token
          const newToken = authService.getToken();
          config.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(`${API_BASE}${url}`, config);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Asset methods
  getAssets(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/assets${queryString ? '?' + queryString : ''}`);
  }

  getAsset(id) {
    return this.request(`/assets/${id}`);
  }

  createAsset(assetData) {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  }

  updateAsset(id, updates) {
    return this.request(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  deleteAsset(id) {
    return this.request(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // Agent and Metrics methods
  getAssetAgentStatus(assetId) {
    return this.request(`/assets/${assetId}/agent-status`);
  }

  getOnlineAgents() {
    return this.request('/agents/online');
  }

  // User methods
  getUsers() {
    return this.request('/users');
  }

  getUser(id) {
    return this.request(`/users/${id}`);
  }

  createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  updateUser(id, updates) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard analytics
  getDashboardAnalytics() {
    return this.request('/analytics/dashboard');
  }

  getDepartmentAnalytics() {
    return this.request('/analytics/departments');
  }

  getCategoryAnalytics() {
    return this.request('/analytics/categories');
  }

  getComplianceAnalytics() {
    return this.request('/analytics/compliance');
  }

  // Reports
  getUtilizationReport() {
    return this.request('/reports/utilization');
  }

  getAssetAgingReport() {
    return this.request('/reports/asset-aging');
  }

  // Scanner methods
  scanDevice(scanData) {
    return this.request('/scanner/scan', {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  }

  quickAddDevice(deviceData) {
    return this.request('/scanner/quick-add', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  validateSerial(serialNumber) {
    return this.request(`/scanner/validate/${serialNumber}`);
  }

  getScanHistory(limit = 50) {
    return this.request(`/scanner/history?limit=${limit}`);
  }

  // Audit methods
  getAuditChain(assetId) {
    return this.request(`/audit/asset/${assetId}`);
  }

  verifyAuditChain(assetId) {
    return this.request(`/audit/asset/${assetId}/verify`);
  }

  getRecentAudits(limit = 10) {
    return this.request(`/audit/recent?limit=${limit}`);
  }

  getUserAuditChanges(userId, skip = 0, limit = 50) {
    return this.request(`/audit/user/${userId}/changes?skip=${skip}&limit=${limit}`);
  }

  getAuditStatistics() {
    return this.request('/audit/statistics');
  }

  // Procurement methods
  getProcurementRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/procurement/requests${queryString ? '?' + queryString : ''}`);
  }

  getMyProcurementRequests(skip = 0, limit = 100) {
    return this.request(`/procurement/requests/my-requests?skip=${skip}&limit=${limit}`);
  }

  getPendingApprovalRequests(skip = 0, limit = 100) {
    return this.request(`/procurement/requests/pending-approval?skip=${skip}&limit=${limit}`);
  }

  getProcurementRequest(requestId) {
    return this.request(`/procurement/requests/${requestId}`);
  }

  createProcurementRequest(requestData) {
    return this.request('/procurement/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  updateProcurementRequest(requestId, updates) {
    return this.request(`/procurement/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  approveProcurementRequest(requestId, comments = null) {
    return this.request(`/procurement/requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  rejectProcurementRequest(requestId, comments = null) {
    return this.request(`/procurement/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  markRequestOrdered(requestId) {
    return this.request(`/procurement/requests/${requestId}/mark-ordered`, {
      method: 'POST',
    });
  }

  fulfillProcurementRequest(requestId, assetData) {
    return this.request(`/procurement/requests/${requestId}/fulfill`, {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  }

  deleteProcurementRequest(requestId) {
    return this.request(`/procurement/requests/${requestId}`, {
      method: 'DELETE',
    });
  }

  getProcurementStatistics() {
    return this.request('/procurement/statistics');
  }
}

export const apiService = new ApiService();