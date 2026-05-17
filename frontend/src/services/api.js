import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  // FormData yuborilganda Content-Type ni o'chirish kerak,
  // aks holda browser boundary qo'sha olmaydi va backend parse qilolmaydi
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
};

export const doctorsAPI = {
  list: () => api.get('/doctors/'),
  create: (data) => api.post('/doctors/', data),
  get: (id) => api.get(`/doctors/${id}/`),
  update: (id, data) => api.patch(`/doctors/${id}/`, data),
  delete: (id) => api.delete(`/doctors/${id}/`),
};

export const patientsAPI = {
  list: () => api.get('/patients/'),
  create: (data) => api.post('/patients/', data),
  get: (id) => api.get(`/patients/${id}/`),
  update: (id, data) => api.patch(`/patients/${id}/`, data),
  delete: (id) => api.delete(`/patients/${id}/`),
};

export const diagnosesAPI = {
  list: (params) => api.get('/diagnoses/', { params }),
  create: (data) => api.post('/diagnoses/', data),
  get: (id) => api.get(`/diagnoses/${id}/`),
  update: (id, data) => api.patch(`/diagnoses/${id}/`, data),
  delete: (id) => api.delete(`/diagnoses/${id}/`),
};

export const statisticsAPI = {
  get: () => api.get('/statistics/'),
};

export default api;
