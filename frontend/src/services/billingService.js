import api from './api';

export const billingService = {
  getInvoices: async (params = {}) => {
    const response = await api.get('/billing/invoices/', { params });
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await api.get(`/billing/invoices/${id}/`);
    return response.data;
  },

  createInvoice: async (data) => {
    const response = await api.post('/billing/invoices/', data);
    return response.data;
  },

  recordPayment: async (invoiceId, paymentData) => {
    const response = await api.post(`/billing/invoices/${invoiceId}/payments/`, paymentData);
    return response.data;
  },

  deleteInvoice: async (id) => {
    const response = await api.delete(`/billing/invoices/${id}/`);
    return response.data;
  }
};
