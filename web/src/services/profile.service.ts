import { api } from './api';

export const updateProfilePicture = async (formData: FormData) => {
  const response = await api.put('/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const changePassword = async (data: { oldPassword: string; newPassword: string }) => {
  const response = await api.put('/profile/password', data);
  return response.data;
};

export const resetPassword = async (data: { email: string }) => {
  const response = await api.post('/profile/reset-password', data);
  return response.data;
};

export const confirmResetPassword = async (data: { token: string; newPassword: string }) => {
  const response = await api.post('/profile/reset-password/confirm', data);
  return response.data;
};