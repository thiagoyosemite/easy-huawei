import api from './api';

const alertService = {
  // Buscar alertas ativos
  getActiveAlerts: async () => {
    try {
      const response = await api.get('/api/alerts/active');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar alertas ativos:', error);
      throw error;
    }
  },

  // Buscar histórico de alertas
  getAlertHistory: async (params = {}) => {
    try {
      const response = await api.get('/api/alerts/history', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico de alertas:', error);
      throw error;
    }
  },

  // Marcar alerta como lido
  markAsRead: async (alertId) => {
    try {
      const response = await api.put(`/api/alerts/${alertId}/read`);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      throw error;
    }
  },

  // Marcar todos os alertas como lidos
  markAllAsRead: async () => {
    try {
      const response = await api.put('/api/alerts/read-all');
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar todos os alertas como lidos:', error);
      throw error;
    }
  },

  // Resolver alerta
  resolveAlert: async (alertId) => {
    try {
      const response = await api.put(`/api/alerts/${alertId}/resolve`);
      return response.data;
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      throw error;
    }
  }
};

export default alertService; 