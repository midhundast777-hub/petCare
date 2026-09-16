import api from './api';

export const vaccinationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/vaccinations/', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/vaccinations/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/vaccinations/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/vaccinations/${id}/`);
    return response.data;
  },

  checkPetVaccinations: async (petId) => {
    const response = await api.get(`/vaccinations/check-pet/${petId}/`);
    return response.data;
  }
};
