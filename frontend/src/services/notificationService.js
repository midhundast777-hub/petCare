import api from './api';

export const notificationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/notifications/', { params });
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read/`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.post('/notifications/mark-all-read/');
    return response.data;
  },

  generateReminders: async () => {
    const response = await api.post('/notifications/generate-reminders/');
    return response.data;
  }
};
