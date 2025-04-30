const logger = require('../logger');
const huaweiConnector = require('./huaweiOltConnector');

class OLTService {
  constructor() {
    this.connector = huaweiConnector;
    this.portConfigs = new Map();
    this.onuLastSeen = new Map();
    
    // Inicializa algumas configurações de exemplo
    this.portConfigs.set('7/8', {
      vlan: 109,
      mode: 'wan',
      dhcpMode: 'none'
    });
  }

  async connect() {
    return this.connector.connect();
  }

  async disconnect() {
    return this.connector.disconnect();
  }

  async getOltInfo() {
    try {
      return await this.connector.getOltInfo();
    } catch (error) {
      logger.error('Erro ao obter informações da OLT', { error: error.message });
      throw error;
    }
  }

  async getOnuList() {
    try {
      const onus = await this.connector.getOnuList();
      // Atualiza o cache de última visualização
      onus.forEach(onu => {
        this.onuLastSeen.set(onu.sn, {
          board: onu.frame,
          port: onu.port,
          timestamp: new Date()
        });
      });
      return onus;
    } catch (error) {
      logger.error('Erro ao obter lista de ONUs', { error: error.message });
      throw error;
    }
  }

  async getUnauthorizedOnus() {
    try {
      return await this.connector.getUnauthorizedOnus();
    } catch (error) {
      logger.error('Erro ao obter ONUs não autorizadas', { error: error.message });
      throw error;
    }
  }

  /**
   * Registra a detecção de uma ONU em uma porta específica
   * @param {string} serial - Serial da ONU
   * @param {number} board - Número da placa
   * @param {number} port - Número da porta
   */
  registerOnuDetection(serial, board, port) {
    const portKey = `${board}/${port}`;
    this.onuLastSeen.set(serial, {
      board,
      port,
      timestamp: new Date(),
      portConfig: this.portConfigs.get(portKey)
    });

    logger.info(`ONU ${serial} detectada na porta ${portKey}`, {
      serial,
      board,
      port,
      timestamp: new Date()
    });
  }

  /**
   * Obtém a última localização conhecida de uma ONU
   * @param {string} serial - Serial da ONU
   * @returns {Object|null} Configuração detectada ou null se não encontrada
   */
  getOnuLastLocation(serial) {
    const lastSeen = this.onuLastSeen.get(serial);
    if (!lastSeen) {
      return null;
    }

    const portKey = `${lastSeen.board}/${lastSeen.port}`;
    const portConfig = this.portConfigs.get(portKey) || {
      vlan: null,
      mode: 'lan',
      dhcpMode: 'none'
    };

    return {
      board: lastSeen.board,
      port: lastSeen.port,
      lastSeen: lastSeen.timestamp,
      ...portConfig
    };
  }

  /**
   * Obtém a configuração de uma porta específica
   * @param {number} board - Número da placa
   * @param {number} port - Número da porta
   * @returns {Object|null} Configuração da porta ou null se não encontrada
   */
  getPortConfig(board, port) {
    const portKey = `${board}/${port}`;
    return this.portConfigs.get(portKey) || null;
  }

  /**
   * Configura uma porta específica
   * @param {number} board - Número da placa
   * @param {number} port - Número da porta
   * @param {Object} config - Configuração da porta
   */
  setPortConfig(board, port, config) {
    const portKey = `${board}/${port}`;
    this.portConfigs.set(portKey, {
      vlan: config.vlan,
      mode: config.mode,
      dhcpMode: config.dhcpMode
    });

    logger.info(`Configuração da porta ${portKey} atualizada`, {
      board,
      port,
      config
    });
  }
}

module.exports = new OLTService(); 