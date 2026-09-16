import api from './api';

export const customerService = {
  getAll: async (params = {}) => {
    const response = await api.get('/customers/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customers/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/customers/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/customers/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/customers/${id}/`);
    return response.data;
  },

  getNotes: async (customerId) => {
    const response = await api.get(`/customers/${customerId}/notes/`);
    return response.data;
  },

  addNote: async (customerId, data) => {
    const response = await api.post(`/customers/${customerId}/notes/create/`, data);
    return response.data;
  }
};
