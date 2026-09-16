import api from './api';

export const medicalService = {
  // Medical Records
  getRecords: async (params = {}) => {
    const response = await api.get('/medical/records/', { params });
    return response.data;
  },

  createRecord: async (data) => {
    const response = await api.post('/medical/records/', data);
    return response.data;
  },

  deleteRecord: async (id) => {
    const response = await api.delete(`/medical/records/${id}/`);
    return response.data;
  },

  // Medications
  getMedications: async (params = {}) => {
    const response = await api.get('/medical/medications/', { params });
    return response.data;
  },

  createMedication: async (data) => {
    const response = await api.post('/medical/medications/', data);
    return response.data;
  },

  updateMedication: async (id, data) => {
    const response = await api.put(`/medical/medications/${id}/`, data);
    return response.data;
  },

  logMedicationDose: async (id, notes = '') => {
    const response = await api.post(`/medical/medications/${id}/log/`, { notes });
    return response.data;
  },

  // Feeding
  getFeedingSchedules: async (params = {}) => {
    const response = await api.get('/medical/feeding/', { params });
    return response.data;
  },

  createFeedingSchedule: async (data) => {
    const response = await api.post('/medical/feeding/', data);
    return response.data;
  },

  updateFeedingSchedule: async (id, data) => {
    const response = await api.put(`/medical/feeding/${id}/`, data);
    return response.data;
  },

  logFeeding: async (id, amount_eaten = 'All', notes = '') => {
    const response = await api.post(`/medical/feeding/${id}/log/`, { amount_eaten, notes });
    return response.data;
  }
};
