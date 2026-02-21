import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../utils/env';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Global refresh lock to prevent concurrent refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          processQueue(null, accessToken);
          isRefreshing = false;

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed — clear tokens but don't redirect.
        // Pages handle 401s gracefully; only auth-required features degrade.
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API service functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, fullName: string) =>
    api.post('/auth/register', { email, password, fullName }),
  
  requestOTP: (email: string) =>
    api.post('/auth/login/request-otp', { email }),
  
  verifyOTP: (email: string, otp: string) =>
    api.post('/auth/login/verify-otp', { email, otp }),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  validateToken: () =>
    api.get('/auth/validate'),
};

export const calendarAPI = {
  getToday: (timezone?: string) =>
    api.get('/api/v1/islam/calendar/today', { params: { timezone } }),
  
  convertToHijri: (date: string, timezone?: string) =>
    api.get('/api/v1/islam/calendar/convert/to-hijri', { params: { date, timezone } }),
  
  convertToGregorian: (year: number, month: number, day: number, timezone?: string) =>
    api.get('/api/v1/islam/calendar/convert/to-gregorian', { params: { year, month, day, timezone } }),
  
  getGregorianMonth: (year: number, month: number, timezone?: string) =>
    api.get('/api/v1/islam/calendar/gregorian-month', { params: { year, month, timezone } }),
  
  getHijriMonth: (year: number, month: number, timezone?: string) =>
    api.get('/api/v1/islam/calendar/hijri-month', { params: { year, month, timezone } }),
  
  getEvents: () =>
    api.get('/api/v1/islam/calendar/events'),
  
  getUpcomingEvents: (days: number = 90, timezone?: string) =>
    api.get('/api/v1/islam/calendar/events/upcoming', { params: { days, timezone } }),
  
  getMonths: () =>
    api.get('/api/v1/islam/calendar/months'),
};

export const prayerAPI = {
  getTimes: (lat: number, lng: number, date?: string, method?: string) =>
    api.get('/api/v1/islam/prayers/times', { params: { lat, lng, date, method } }),
  
  getCurrent: (lat: number, lng: number) =>
    api.get('/api/v1/islam/prayers/current', { params: { lat, lng } }),
  
  logPrayer: (prayerName: string, date: string, status: 'on_time' | 'late' | 'qada') =>
    api.post('/api/v1/islam/prayers/log', { prayerName, date, status }),
  
  getLogs: (startDate?: string, endDate?: string) =>
    api.get('/api/v1/islam/prayers/logs', { params: { startDate, endDate } }),
  
  getStats: () =>
    api.get('/api/v1/islam/prayers/stats'),
};

export const quranAPI = {
  getSurahs: () =>
    api.get('/api/v1/islam/quran/surahs'),
  
  getSurah: (id: number) =>
    api.get(`/api/v1/islam/quran/surah/${id}`),
  
  searchVerses: (query: string) =>
    api.get('/api/v1/islam/quran/search', { params: { q: query } }),
  
  addBookmark: (surahId: number, verseNumber: number, note?: string) =>
    api.post('/api/v1/islam/quran/bookmarks', { surahId, verseNumber, note }),
  
  getBookmarks: () =>
    api.get('/api/v1/islam/quran/bookmarks'),
};

export const dhikrAPI = {
  getCounters: () =>
    api.get('/api/v1/islam/dhikr/counters'),

  createCounter: (name: string, phrase?: string, targetCount?: number) =>
    api.post('/api/v1/islam/dhikr/counters', { name, phrase, targetCount }),

  updateCounter: (id: string, count: number) =>
    api.patch(`/api/v1/islam/dhikr/counters/${id}`, { count }),

  deleteCounter: (id: string) =>
    api.delete(`/api/v1/islam/dhikr/counters/${id}`),

  createGoal: (phrase: string, targetCount: number, period: 'daily' | 'weekly' | 'monthly') =>
    api.post('/api/v1/islam/dhikr/goals', { phrase, targetCount, period }),

  getGoals: () =>
    api.get('/api/v1/islam/dhikr/goals'),

  getStats: () =>
    api.get('/api/v1/islam/dhikr/stats'),

  getHistory: () =>
    api.get('/api/v1/islam/dhikr/history'),

  getPhrases: () =>
    api.get('/api/v1/islam/dhikr/phrases'),
};

export const qiblaAPI = {
  getDirection: (lat: number, lng: number) =>
    api.get('/api/v1/islam/qibla', { params: { lat, lng } }),
};

export const namesAPI = {
  getAllNames: () =>
    api.get('/api/v1/islam/names/allah'),

  getNameById: (id: number) =>
    api.get(`/api/v1/islam/names/allah/${id}`),

  getDailyName: () =>
    api.get('/api/v1/islam/names/daily'),

  addFavorite: (nameId: number) =>
    api.post('/api/v1/islam/names/favorites', { nameId }),

  getFavorites: () =>
    api.get('/api/v1/islam/names/favorites'),
};

export const feelingsAPI = {
  getAllEmotions: () =>
    api.get('/api/v1/islam/feelings'),

  getEmotionDetails: (emotion: string) =>
    api.get(`/api/v1/islam/feelings/${emotion}`),
};
