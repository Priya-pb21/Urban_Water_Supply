import axios from 'axios';
import { io } from 'socket.io-client';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('water_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    config.headers['x-user-id'] = user.id;
    config.headers['x-user-role'] = user.role;
    config.headers['x-user-name'] = user.name;
  }
  return config;
});

export function connectSocket(userId) {
  return io(SOCKET_URL, {
    auth: { userId },
    transports: ['websocket']
  });
}

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  register: (payload) => api.post('/auth/register', payload)
};

export const waterApi = {
  areas: () => api.get('/areas'),
  allLocations: () => api.get('/areas/all'),
  mapData: () => api.get('/areas/map/data'),
  createArea: (payload) => api.post('/areas', payload),
  addLocation: (payload) => api.post('/areas/add-location', payload),
  demand: () => api.get('/demand'),
  demandSummary: () => api.get('/demand/summary'),
  createDemand: (payload) => api.post('/demand', payload),
  getTotalDemand: () => api.get('/demand/getdemand'),
  supply: () => api.get('/supply'),
  todaySupply: () => api.get('/supply/today'),
  createSupply: (payload) => api.post('/supply', payload),
  allocations: () => api.get('/allocation'),
  dashboard: () => api.get('/allocation/dashboard'),
  runAllocation: (payload) => api.post('/allocation/run', payload),
  issues: () => api.get('/issues'),
  createIssue: (payload) => api.post('/issues', payload),
  updateIssue: (id, payload) => api.patch(`/issues/${id}/status`, payload),
  notifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  chatbot: (payload) => api.post('/chatbot', payload),
  // Add inside waterApi: {}
credits: () => api.get('/credits'),
updateCredits: (areaId, payload) => api.put(`/credits/${areaId}`, payload),
priorities: () => api.get('/priorities'),  // optional read-only endpoint
allocationLog: () => api.get('/allocation/log'),
};

export default api;
