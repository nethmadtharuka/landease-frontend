import api from './axios';

// Paths match the ASP.NET controllers exactly. Enum values are sent and received as strings.

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register:      (data) => api.post('/api/Auth/register', data),
  login:         (data) => api.post('/api/Auth/login', data),
  getProfile:    ()     => api.get('/api/Auth/profile'),
  // Backend UpdateProfileDto: { fullName, phoneNumber?, originCountry?, destinationCountry?, migrationStatus? }
  updateProfile: (data) => api.put('/api/Auth/profile', data),
};

// ── KYC ──────────────────────────────────────────────────────
export const kycApi = {
  // Content-Type undefined lets the browser add the multipart boundary.
  submit:     (formData)     => api.post('/api/Kyc/submit', formData, { headers: { 'Content-Type': undefined } }),
  getStatus:  ()             => api.get('/api/Kyc/status'),
  getPending: ()             => api.get('/api/Kyc/pending'),
  review:     (id, data)     => api.put(`/api/Kyc/${id}/review`, data),
};

// ── Services ──────────────────────────────────────────────────
export const servicesApi = {
  getAll:       (params)     => api.get('/api/Services', { params }),
  getById:      (id)         => api.get(`/api/Services/${id}`),
  getByProvider:(id)         => api.get(`/api/Services/provider/${id}`),
  // Backend CreateServiceDto: { title, description, category, price, destinationCountry }
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
  updateStatus: (id, status) => api.put(`/api/Bookings/${id}/status`, { status }),
};

// ── Reviews ───────────────────────────────────────────────────
export const reviewsApi = {
  // Backend CreateReviewDto: { bookingId, rating (1-5), comment? }
  create:         (data)       => api.post('/api/Reviews', data),
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
  getHistory:  ()     => api.get('/api/Sos/history'),
  acknowledge: (id)   => api.put(`/api/Sos/${id}/acknowledge`),
  resolve:     (id)   => api.put(`/api/Sos/${id}/resolve`),
};

// ── AI ────────────────────────────────────────────────────────
export const aiApi = {
  chat:               (data)      => api.post('/api/Ai/chat', data),
  getHistory:         (params)    => api.get('/api/Ai/chat/history', { params }),
  clearHistory:       ()          => api.delete('/api/Ai/chat/history'),
  translate:          (data)      => api.post('/api/Ai/translate', data),
  getRecommendations: ()          => api.get('/api/Ai/recommendations'),
  getExplanation:     (serviceId) => api.get(`/api/Ai/recommendations/explain/${serviceId}`),
};

// ── Admin / staff ─────────────────────────────────────────────
export const adminApi = {
  getFraudFlags:   ()           => api.get('/api/Admin/fraud-flags'),
  resolveFlag:     (id)         => api.put(`/api/Admin/fraud-flags/${id}/resolve`),
  moderateReview:  (data)       => api.post('/api/Admin/moderate/review', data),
  changeRole:      (id, role)   => api.put(`/api/Admin/users/${id}/role`, { role }),
  getPendingKyc:   ()           => api.get('/api/Kyc/pending'),
  reviewKyc:       (id, data)   => api.put(`/api/Kyc/${id}/review`, data),
};

// ── Place recognition (photo → landmark info) ─────────────────
export const placeApi = {
  // Backend PlaceRecognitionRequestDto: { imageBase64 (data: URL prefix allowed), mimeType: image/jpeg|image/png }
  recognize: (data) => api.post('/api/Place/recognize', data),
};

// ── Immigration profile-strength assessment ───────────────────
export const immigrationApi = {
  analyze: (profileData, files = []) => {
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, val]) => formData.append(key, val));
    // The backend reads the document type from the file-name prefix: "<DocType>_<original name>".
    files.forEach(({ file, docType }) => formData.append('documents', file, `${docType}_${file.name}`));
    return api.post('/api/immigration/analyze', formData, { headers: { 'Content-Type': undefined } });
  },
  getVisaTypes: () => api.get('/api/immigration/visa-types'),
  getCountries: () => api.get('/api/immigration/countries'),
};
