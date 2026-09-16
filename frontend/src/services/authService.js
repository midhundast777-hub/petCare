import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_info', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/auth/profile/', data);
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/auth/users/', userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/auth/users/${id}/`);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  },

  getCurrentUser: () => {
    const info = localStorage.getItem('user_info');
    return info ? JSON.parse(info) : null;
  }
};
