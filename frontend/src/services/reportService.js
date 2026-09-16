import api from './api';

export const reportService = {
  getSummary: async () => {
    const response = await api.get('/reports/summary/');
    return response.data;
  },

  getCharts: async () => {
    const response = await api.get('/reports/charts/');
    return response.data;
  },

  getDetailed: async (params = {}) => {
    const response = await api.get('/reports/detailed/', { params });
    return response.data;
  }
};
