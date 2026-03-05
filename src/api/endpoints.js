import api from './axios';

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register:      (data) => api.post('/api/Auth/register', data),
  login:         (data) => api.post('/api/Auth/login', data),
  getProfile:    ()     => api.get('/api/Auth/profile'),
  updateProfile: (data) => api.put('/api/Auth/profile', data),
};

// ── KYC ──────────────────────────────────────────────────────
export const kycApi = {
  submit:     (formData)     => api.post('/api/Kyc/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStatus:  ()             => api.get('/api/Kyc/status'),
  getPending: ()             => api.get('/api/Kyc/pending'),
  review:     (id, data)     => api.put(`/api/Kyc/${id}/review`, data),
};

// ── Services ──────────────────────────────────────────────────
export const servicesApi = {
  getAll:       (params)     => api.get('/api/Services', { params }),
  getById:      (id)         => api.get(`/api/Services/${id}`),
  getByProvider:(id)         => api.get(`/api/Services/provider/${id}`),
  create:       (data)       => api.post('/api/Services', data),
  update:       (id, data)   => api.put(`/api/Services/${id}`, data),
  delete:       (id)         => api.delete(`/api/Services/${id}`),
};

// ── Bookings ──────────────────────────────────────────────────
export const bookingsApi = {
  create:       (data)       => api.post('/api/Bookings', data),
  getMine:      ()           => api.get('/api/Bookings/mine'),
  getIncoming:  ()           => api.get('/api/Bookings/incoming'),
  getById:      (id)         => api.get(`/api/Bookings/${id}`),
  updateStatus: (id, data)   => api.put(`/api/Bookings/${id}/status`, data),
};

// ── Reviews ───────────────────────────────────────────────────
export const reviewsApi = {
  create:         (data) => api.post('/api/Reviews', data),
  getByProvider:  (providerId) => api.get(`/api/Reviews/provider/${providerId}`),
};

// ── Community ─────────────────────────────────────────────────
export const communityApi = {
  getAll:      (params)      => api.get('/api/Community', { params }),
  getById:     (id)          => api.get(`/api/Community/${id}`),
  join:        (id)          => api.post(`/api/Community/${id}/join`),
  leave:       (id)          => api.post(`/api/Community/${id}/leave`),
  getMembers:  (id, params)  => api.get(`/api/Community/${id}/members`, { params }),
  getPosts:    (id, params)  => api.get(`/api/Community/${id}/posts`, { params }),
  createPost:  (id, data)    => api.post(`/api/Community/${id}/posts`, data),
};

// ── SOS ───────────────────────────────────────────────────────
export const sosApi = {
  trigger:     (data) => api.post('/api/Sos/trigger', data),
  getActive:   ()     => api.get('/api/Sos/active'),
  getHistory:  ()     => api.get('/api/Sos/history'),           // was missing
  acknowledge: (id)   => api.put(`/api/Sos/${id}/acknowledge`),
  resolve:     (id)   => api.put(`/api/Sos/${id}/resolve`),
};

// ── AI ────────────────────────────────────────────────────────
export const aiApi = {
  chat:               (data)      => api.post('/api/Ai/chat', data),
  getHistory:         (params)    => api.get('/api/Ai/chat/history', { params }),
  clearHistory:       ()          => api.delete('/api/Ai/chat/history'),
  getRecommendations: ()          => api.get('/api/Ai/recommendations'),
  getExplanation:     (serviceId) => api.get(`/api/Ai/recommendations/explain/${serviceId}`),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  getFraudFlags:   ()         => api.get('/api/Admin/fraud-flags'),
  resolveFlag:     (id)       => api.put(`/api/Admin/fraud-flags/${id}/resolve`),
  moderateReview:  (data)     => api.post('/api/Admin/moderate/review', data),
  getPendingKyc:   ()         => api.get('/api/Kyc/pending'),
  reviewKyc:       (id, data) => api.put(`/api/Kyc/${id}/review`, data),
};