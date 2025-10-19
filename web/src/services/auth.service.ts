import { LoginBody , RegisterBodyWithRole } from '../../../api/src/types/auth'; // Sesuaikan dengan tipe data Anda
import { api } from './api';
import axios, { isAxiosError } from 'axios';

export const login = async (data: LoginBody) => {
  try {
    const response = await api.post('/auth/login', data);
    
    const { token, user } = response.data;

    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_role', user.role); 

    return user;
  } catch (error) {
    // --- PERBAIKAN: Type Narrowing ---
    if (isAxiosError(error) && error.response) {
      // Jika ini adalah error dari API server (kode 400, 401, 403, dll.)
      const errorMessage = error.response.data?.message;
      
      // Melemparkan pesan spesifik dari backend (misalnya "Kredensial tidak valid.")
      throw errorMessage || 'Gagal login. Kesalahan respons server.';
    }
    
    // Jika ini adalah error jaringan (bukan error API/response) atau error lain
    console.error("Kesalahan Jaringan atau Unknown Error:", error);
    throw 'Terjadi kesalahan jaringan atau kesalahan tak terduga.';
  }
};

export const register = async (data: RegisterBodyWithRole) => {
  try {
    const response = await api.post("/auth/register" , data);

    const {token , user} = response.data;

    //* simpen token dan role ke localstorage
    localStorage.setItem("jwt_token" , token);
    localStorage.setItem("user_role" , user.role);

    return user;

  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errorMessage = error.response.data?.message;
      throw errorMessage || "Failed to register. Server responded with an error.";
    }
    console.error("Network or Unknown Error during registration:", error);
    throw "A network error or unexpected error occurred.";
  }
};