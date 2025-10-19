import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; 

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk Menangani Token JWT
api.interceptors.request.use(config => {
  // --- PERBAIKAN FINAL: Cek window sebelum mengakses localStorage ---
  if (typeof window !== 'undefined') { 
    const token = localStorage.getItem('jwt_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // ----------------------------------------------------------------
  
  return config;
}, error => {
  return Promise.reject(error);
});