import axios from 'axios';

// Unified Python FastAPI Backend Base URL (configurable via .env for production deployment)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT / session token
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('airguard_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return config;
});

// Response interceptor to unwrap unified ApiResponse envelope
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export const airGuardApi = {
  // Authentication
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),

  // Cities & Geolocation
  getCities: () => api.get('/cities'),
  getCityByName: (name) => api.get(`/cities/${name}`),
  searchCities: (query) => api.get('/cities/search', { params: { query } }),
  locateUser: (latitude, longitude, name = null) => api.post('/cities/locate', { latitude, longitude, name }),
  addCity: (cityData) => api.post('/cities/add', cityData),
  compareCities: (city1, city2, city3) =>
    api.get('/cities/compare', { params: { city1, city2, city3 } }),

  // Air Quality Telemetry
  getCurrent: (city) => api.get(`/air-quality/current/${city}`),
  getHistory: (city, hours = 72) => api.get(`/air-quality/history/${city}`, { params: { hours } }),
  getTrends: (city) => api.get(`/air-quality/trends/${city}`),
  getPollutants: (city) => api.get(`/air-quality/pollutants/${city}`),

  // Machine Learning
  predictAqi: (payload) => api.post('/ml/predict', payload),
  getModelPerformance: () => api.get('/ml/model-performance'),
  getPredictionHistory: (limit = 20) => api.get('/predictions/history', { params: { limit } }),

  // Generative AI & Advisory
  aiExplain: (payload) => api.post('/ai/explain', payload),
  aiAdvisory: (payload) => api.post('/ai/advisory', payload),
  aiChat: (payload) => api.post('/ai/chat', payload),

  // Favorites
  getFavorites: (userId = 'default_user') => api.get('/favorites', { params: { userId } }),
  addFavorite: (cityName, userId = 'default_user') => api.post('/favorites', { cityName, userId }),
  removeFavorite: (cityName, userId = 'default_user') =>
    api.delete(`/favorites/${cityName}`, { params: { userId } }),
};

export default api;
