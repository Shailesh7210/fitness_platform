import axios from 'axios';
import toast  from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.message || 'Something went wrong';

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (err.response?.status !== 400) {
      toast.error(message);
    }

    return Promise.reject(err);
  }
);