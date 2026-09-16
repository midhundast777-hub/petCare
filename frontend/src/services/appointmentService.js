import api from './api';

export const appointmentService = {
  getAll: async (params = {}) => {
    const response = await api.get('/appointments/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/appointments/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/appointments/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/appointments/${id}/`, data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/appointments/${id}/status/`, { status });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/appointments/${id}/`);
    return response.data;
  }
};
