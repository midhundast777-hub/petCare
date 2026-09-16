import api from './api';

export const petService = {
  getAll: async (params = {}) => {
    const response = await api.get('/pets/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/pets/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/pets/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/pets/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/pets/${id}/`);
    return response.data;
  }
};
