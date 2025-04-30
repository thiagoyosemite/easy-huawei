import api from './api';

export const onuService = {
  // Busca todas as ONUs não autorizadas
  async getUnauthorizedONUs() {
    const response = await api.get('/api/unauthorized-onus');
    return response.data;
  },

  // Busca uma ONU não autorizada específica
  getUnauthorizedONU: async (serial) => {
    const response = await api.get(`/api/unauthorized-onus/${serial}`);
    return response.data;
  },

  // Provisiona uma ONU
  async provisionONU(serial, provisionData) {
    const response = await api.post(`/api/onus/${serial}/provision`, provisionData);
    return response.data;
  },

  // Busca todas as ONUs
  getAllONUs: async () => {
    const response = await api.get('/api/onus');
    return response.data;
  },

  // Busca detalhes de uma ONU específica
  async getONUDetails(serial) {
    const response = await api.get(`/api/onus/${serial}/details`);
    return response.data;
  },

  // Busca dados de tráfego de uma ONU
  async getTrafficData(serial) {
    const response = await api.get(`/api/onus/${serial}/traffic`);
    return response.data;
  },

  // Busca histórico de sinal de uma ONU
  async getSignalHistory(serial) {
    const response = await api.get(`/api/onus/${serial}/signal-history`);
    return response.data;
  },

  // Busca histórico geral de uma ONU
  async getHistory(serial) {
    const response = await api.get(`/api/onus/${serial}/history`);
    return response.data;
  },

  // Busca status de uma ONU
  async getONUStatus(serial) {
    const response = await api.get(`/api/onus/${serial}/status`);
    return response.data;
  },

  // Reinicia uma ONU
  async rebootONU(serial) {
    const response = await api.post(`/api/onus/${serial}/reboot`);
    return response.data;
  },

  // Configura uma ONU
  async configureONU(serial, config = {}) {
    const response = await api.post(`/api/onus/${serial}/configure`, config);
    return response.data;
  },

  // Configura uma porta específica de uma ONU
  configureONUPort: async (serial, port, config) => {
    const response = await api.post(`/api/onus/${serial}/ports/${port}/configure`, config);
    return response.data;
  },

  // Configura portas de uma ONU
  async configurePorts(serial, portConfig) {
    const response = await api.post(`/api/onus/${serial}/ports/configure`, portConfig);
    return response.data;
  },

  // Executa uma ação específica em uma ONU (start, stop, reboot, etc)
  async performAction(serial, action) {
    const response = await api.post(`/api/onus/${serial}/${action}`);
    return response.data;
  }
}; 