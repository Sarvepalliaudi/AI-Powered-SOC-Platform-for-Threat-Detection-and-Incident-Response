import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('soc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('soc_token');
      localStorage.removeItem('soc_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const dashboardAPI = {
  overview: () => api.get('/dashboard/overview'),
  attackTimeline: () => api.get('/dashboard/attack-timeline'),
  traffic: () => api.get('/dashboard/traffic'),
  mitre: () => api.get('/dashboard/mitre'),
  aiAnalysis: () => api.get('/dashboard/ai-analysis'),
  geoAttacks: () => api.get('/dashboard/geo-attacks'),
};

export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  upload: (file) => {
    const formData = new FormData();
    formData.append('logFile', file);
    return api.post('/logs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  stats: () => api.get('/logs/stats'),
  delete: (id) => api.delete(`/logs/${id}`),
};

export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  update: (id, data) => api.patch(`/alerts/${id}`, data),
  stats: () => api.get('/alerts/stats'),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export const incidentsAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.patch(`/incidents/${id}`, data),
  addTimeline: (id, data) => api.post(`/incidents/${id}/timeline`, data),
  addComment: (id, comment) => api.post(`/incidents/${id}/comments`, { comment }),
  addEvidence: (id, data) => api.post(`/incidents/${id}/evidence`, data),
};

export const reportsAPI = {
  getAll: () => api.get('/reports'),
  generateIncident: (incidentId) => api.post(`/reports/incident/${incidentId}`),
  generateThreat: () => api.post('/reports/threat-analysis'),
  generateLogSummary: () => api.post('/reports/log-summary'),
  download: (filename) => api.get(`/reports/download/${filename}`, { responseType: 'blob' }),
};

export default api;
