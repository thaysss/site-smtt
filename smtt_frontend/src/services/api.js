// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // O endereço do nosso Flask
});

// Interceptor: Antes de qualquer requisição sair, ele injeta o token (se existir)
api.interceptors.request.use((config) => {
  // Se a rota for administrativa, utiliza o adminToken, caso contrário usa o token de cidadão
  const isAdminRoute = config.url && config.url.includes('/admin');
  const token = isAdminRoute ? localStorage.getItem('adminToken') : localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Resposta: Captura erros 401 e realiza logout automático
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isConfigAdminRoute = error.config && error.config.url && error.config.url.includes('/admin');
      
      if (isConfigAdminRoute) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminNome');
        window.location.href = '/admin/login?message=session_expired';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('nomeUsuario');
        window.location.href = '/login?message=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;