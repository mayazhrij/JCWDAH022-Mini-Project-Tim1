import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; 

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor untuk Menangani Token JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  
  if (typeof window !== 'undefined') { 
    const token = localStorage.getItem('jwt_token');
    
    if (token) {
      // --- PERBAIKAN KRITIS UNTUK TYPING HEADERS ---
      // Jika config.headers belum ada (meskipun jarang), inisialisasi sebagai objek.
      // TypeScript tidak akan lagi mengeluh karena kita memastikan objek Headers tersedia.
      config.headers = config.headers || {};
      
      // Karena kita menggunakan Axios v1.x/v2.x, kita perlu menggunakan sintaks yang tepat
      // untuk mendefinisikan Authorization Header. Kita menggunakan type assertion jika diperlukan.
      
      // Pastikan Authorization Header ditambahkan
      config.headers.Authorization = `Bearer ${token}`;
      // ---------------------------------------------
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});