import api from './api';

export const boardingService = {
  // Rooms
  getRooms: async (params = {}) => {
    const response = await api.get('/boarding/rooms/', { params });
    return response.data;
  },

  createRoom: async (data) => {
    const response = await api.post('/boarding/rooms/', data);
    return response.data;
  },

  updateRoom: async (id, data) => {
    const response = await api.put(`/boarding/rooms/${id}/`, data);
    return response.data;
  },

  // Bookings
  getBookings: async (params = {}) => {
    const response = await api.get('/boarding/bookings/', { params });
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/boarding/bookings/${id}/`);
    return response.data;
  },

  createBooking: async (data) => {
    const response = await api.post('/boarding/bookings/', data);
    return response.data;
  },

  updateBooking: async (id, data) => {
    const response = await api.patch(`/boarding/bookings/${id}/`, data);
    return response.data;
  },

  deleteBooking: async (id) => {
    const response = await api.delete(`/boarding/bookings/${id}/`);
    return response.data;
  },

  // Checklist
  getChecklist: async (bookingId) => {
    const response = await api.get(`/boarding/bookings/${bookingId}/checklist/`);
    return response.data;
  },

  updateChecklist: async (bookingId, data) => {
    const response = await api.patch(`/boarding/bookings/${bookingId}/checklist/`, data);
    return response.data;
  },

  // Daily Care Logs
  getCareLogs: async (bookingId) => {
    const response = await api.get(`/boarding/bookings/${bookingId}/care-logs/`);
    return response.data;
  },

  addCareLog: async (bookingId, data) => {
    const response = await api.post(`/boarding/bookings/${bookingId}/care-logs/`, data);
    return response.data;
  }
};
