import axios from 'axios';

function readCookie(name) {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrf = readCookie('labslot_csrf');
  if (csrf) {
    config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    const err = new Error(message);
    err.status = error.response?.status;
    err.details = error.response?.data?.details;
    throw err;
  },
);

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const userApi = {
  updateMe: (payload) => api.patch('/users/me', payload).then((r) => r.data),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};

export const resourceApi = {
  list: (params) => api.get('/resources', { params }).then((r) => r.data),
  locations: () => api.get('/resources/locations').then((r) => r.data),
  get: (id) => api.get(`/resources/${id}`).then((r) => r.data),
  availability: (id, date) => api.get(`/resources/${id}/availability`, { params: { date } }).then((r) => r.data),
};

export const bookingApi = {
  create: (payload) => api.post('/bookings', payload).then((r) => r.data),
  mine: (params) => api.get('/bookings/my', { params }).then((r) => r.data),
  history: (params) => api.get('/bookings/history', { params }).then((r) => r.data),
  get: (id) => api.get(`/bookings/${id}`).then((r) => r.data),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),
  dashboard: () => api.get('/bookings/dashboard').then((r) => r.data),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  bookings: (params) => api.get('/admin/bookings', { params }).then((r) => r.data),
  approve: (id) => api.patch(`/admin/bookings/${id}/approve`).then((r) => r.data),
  reject: (id, reason) => api.patch(`/admin/bookings/${id}/reject`, { reason }).then((r) => r.data),
  cancel: (id, reason) => api.patch(`/admin/bookings/${id}/cancel`, { reason }).then((r) => r.data),
  resources: (params) => api.get('/admin/resources', { params }).then((r) => r.data),
  createResource: (payload) => api.post('/admin/resources', payload).then((r) => r.data),
  updateResource: (id, payload) => api.patch(`/admin/resources/${id}`, payload).then((r) => r.data),
  updateResourceStatus: (id, status) => api.patch(`/admin/resources/${id}/status`, { status }).then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  reports: (params) => api.get('/admin/reports', { params }).then((r) => r.data),
};
