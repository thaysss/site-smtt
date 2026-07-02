// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // O endereço do nosso Flask
});

// Interceptor: Antes de qualquer requisição sair, ele injeta o token (se existir)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Pega o token salvo no navegador
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;