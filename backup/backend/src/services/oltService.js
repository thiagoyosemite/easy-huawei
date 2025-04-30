const oltCommands = require('./oltCommands');
const oltConnection = require('./oltConnection');
const logger = require('../logger');
const onuHistory = require('./onuHistoryService');

class OLTService {
  constructor() {
    this.commands = oltCommands;
    this.connection = oltConnection;
    this.onuDetections = new Map(); // Armazena as últimas detecções de ONUs
    this.portConfigurations = new Map(); // Armazena as configurações de portas
    this.isSimulationMode = process.env.SIMULATION_MODE === 'true';
  }

  async initialize() {
    try {
      if (!this.isSimulationMode) {
        await this.connection.connect();
        const commands = await this.commands.enterConfigMode();
        for (const cmd of commands) {
          await this.connection.executeCommand(cmd);
        }
      }
      logger.info('Serviço OLT inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar serviço OLT:', error);
      throw error;
    }
  }

  /**
   * Registra uma detecção de ONU
   * @param {string} serial - Número serial da ONU
   * @param {Object} detection - Dados da detecção (board, port, etc)
   */
  registerONUDetection(serial, detection) {
    logger.info(`Registrando detecção de ONU: ${serial}`, { detection });
    this.onuDetections.set(serial, {
      ...detection,
      timestamp: new Date()
    });
  }

  /**
   * Obtém a última localização conhecida de uma ONU
   * @param {string} serial - Número serial da ONU
   * @returns {Object|null} Dados da última detecção ou null se não encontrada
   */
  getLastKnownONULocation(serial) {
    const detection = this.onuDetections.get(serial);
    if (!detection) {
      logger.warn(`Nenhuma detecção encontrada para ONU: ${serial}`);
      return null;
    }
    return detection;
  }

  /**
   * Configura uma porta da OLT
   * @param {number} board - Número da placa
   * @param {number} port - Número da porta
   * @param {Object} config - Configurações da porta
   */
  configurePort(board, port, config) {
    const portKey = `${board}-${port}`;
    logger.info(`Configurando porta da OLT: ${portKey}`, { config });
    
    // Validação básica da configuração
    if (!config || typeof config !== 'object') {
      throw new Error('Configuração inválida');
    }

    this.portConfigurations.set(portKey, {
      ...config,
      lastUpdated: new Date()
    });
  }

  /**
   * Obtém a configuração de uma porta
   * @param {number} board - Número da placa
   * @param {number} port - Número da porta
   * @returns {Object|null} Configuração da porta ou null se não encontrada
   */
  getPortConfiguration(board, port) {
    const portKey = `${board}-${port}`;
    return this.portConfigurations.get(portKey) || null;
  }

  /**
   * Lista todas as configurações de portas
   * @returns {Array} Lista de configurações de portas
   */
  listPortConfigurations() {
    return Array.from(this.portConfigurations.entries()).map(([key, config]) => ({
      ...config,
      port: key
    }));
  }

  async discoverUnauthorizedONUs(port) {
    try {
      if (!this.commands.validatePort(port)) {
        throw new Error('Formato de porta inválido');
      }

      const commands = await this.commands.discoverONUs(port);
      
      if (this.isSimulationMode) {
        return this._simulateONUDiscovery(port);
      }

      const results = [];
      for (const cmd of commands) {
        const response = await this.connection.executeCommand(cmd);
        results.push(this._parseONUDiscoveryResponse(response));
      }

      return {
        port,
        onus: results.flat()
      };
    } catch (error) {
      logger.error('Erro ao descobrir ONUs:', error);
      throw new Error('Falha ao descobrir ONUs não autorizadas');
    }
  }

  async authorizeONU(port, serial, description, options = {}) {
    try {
      if (!this.commands.validatePort(port)) {
        throw new Error('Formato de porta inválido');
      }

      const {
        lineProfile = "1",
        srvProfile = "1",
        nativeVlan
      } = options;

      // Comandos para autorização
      const authCommands = await this.commands.authorizeONU(
        port, 
        serial, 
        description,
        lineProfile,
        srvProfile
      );

      if (!this.isSimulationMode) {
        for (const cmd of authCommands) {
          await this.connection.executeCommand(cmd);
        }

        // Configuração adicional de portas se necessário
        if (nativeVlan) {
          const portCommands = await this.commands.configureONUPorts(port, 1, { nativeVlan });
          for (const cmd of portCommands) {
            await this.connection.executeCommand(cmd);
          }
        }
      }

      // Registra a autorização
      this.onuDetections.set(serial, {
        port,
        description,
        lineProfile,
        srvProfile,
        nativeVlan,
        authorizedAt: new Date(),
        status: 'authorized'
      });

      return {
        success: true,
        message: 'ONU autorizada com sucesso',
        details: {
          port,
          serial,
          description,
          lineProfile,
          srvProfile,
          nativeVlan,
          timestamp: new Date()
        }
      };
    } catch (error) {
      logger.error('Erro ao autorizar ONU:', error);
      throw new Error('Falha ao autorizar ONU');
    }
  }

  async getONUStatus(port, onuId) {
    try {
      if (!this.commands.validatePort(port)) {
        throw new Error('Formato de porta inválido');
      }

      const commands = await this.commands.getONUInfo(port, onuId);

      if (this.isSimulationMode) {
        return this._simulateONUStatus();
      }

      const results = {};
      for (const cmd of commands) {
        const response = await this.connection.executeCommand(cmd);
        Object.assign(results, this._parseONUStatusResponse(response));
      }

      return results;
    } catch (error) {
      logger.error('Erro ao obter status da ONU:', error);
      throw new Error('Falha ao obter status da ONU');
    }
  }

  async configureVLAN(vlanId, description, ports = []) {
    try {
      if (!this.commands.validateVlan(vlanId)) {
        throw new Error('VLAN ID inválido');
      }

      const vlanCommands = await this.commands.configureVLAN(vlanId, description);
      
      if (!this.isSimulationMode) {
        for (const cmd of vlanCommands) {
          await this.connection.executeCommand(cmd);
        }

        // Configura service-ports se necessário
        for (const port of ports) {
          const servicePortCmd = await this.commands.configureServicePort(vlanId, port);
          await this.connection.executeCommand(servicePortCmd);
        }
      }

      return {
        success: true,
        message: 'VLAN configurada com sucesso',
        details: {
          vlanId,
          description,
          ports,
          timestamp: new Date()
        }
      };
    } catch (error) {
      logger.error('Erro ao configurar VLAN:', error);
      throw new Error('Falha ao configurar VLAN');
    }
  }

  async getSystemStatus() {
    try {
      const commands = await this.commands.getSystemInfo();

      if (this.isSimulationMode) {
        return this._simulateSystemStatus();
      }

      const results = {};
      for (const cmd of commands) {
        const response = await this.connection.executeCommand(cmd);
        Object.assign(results, this._parseSystemStatusResponse(response));
      }

      return results;
    } catch (error) {
      logger.error('Erro ao obter status do sistema:', error);
      throw new Error('Falha ao obter status do sistema');
    }
  }

  // Métodos auxiliares para simulação
  _simulateONUDiscovery(port) {
    return {
      port,
      onus: [
        {
          serial: 'HWTC' + Math.random().toString(36).substr(2, 8),
          type: 'HG8245H',
          status: 'discovered',
          firstSeen: new Date(),
          signal: -20 - Math.random() * 10
        }
      ]
    };
  }

  _simulateONUStatus() {
    return {
      status: 'online',
      signal: -20 - Math.random() * 10,
      temperature: 45 + Math.random() * 10,
      lastSeen: new Date(),
      uptime: Math.floor(Math.random() * 1000000)
    };
  }

  _simulateSystemStatus() {
    return {
      temperature: 35 + Math.random() * 10,
      cpuUsage: 20 + Math.random() * 30,
      memoryUsage: 40 + Math.random() * 20,
      uptime: Math.floor(Math.random() * 10000000),
      lastUpdate: new Date()
    };
  }

  // Métodos de parsing de resposta
  _parseONUDiscoveryResponse(response) {
    // TODO: Implementar parser real baseado no formato de saída da OLT
    return [];
  }

  _parseONUStatusResponse(response) {
    // TODO: Implementar parser real baseado no formato de saída da OLT
    return {};
  }

  _parseSystemStatusResponse(response) {
    // TODO: Implementar parser real baseado no formato de saída da OLT
    return {};
  }

  async startONU(serial) {
    if (this.isSimulationMode) {
      const onu = this.mockData.onus.find(o => o.sn === serial);
      if (!onu) {
        throw new Error('ONU não encontrada');
      }
      onu.status = 'online';
      
      onuHistory.addEvent(serial, {
        type: 'START',
        status: 'online',
        description: 'ONU iniciada manualmente'
      });
      
      return { message: 'ONU iniciada com sucesso' };
    }
    
    try {
      await this.connection.execute(`onu start ${serial}`);
      
      onuHistory.addEvent(serial, {
        type: 'START',
        status: 'online',
        description: 'ONU iniciada manualmente'
      });
      
      return { message: 'ONU iniciada com sucesso' };
    } catch (error) {
      onuHistory.addEvent(serial, {
        type: 'ERROR',
        status: 'error',
        description: `Erro ao iniciar ONU: ${error.message}`
      });
      
      throw new Error(`Erro ao iniciar ONU: ${error.message}`);
    }
  }

  async stopONU(serial) {
    if (this.isSimulationMode) {
      const onu = this.mockData.onus.find(o => o.sn === serial);
      if (!onu) {
        throw new Error('ONU não encontrada');
      }
      onu.status = 'offline';
      
      onuHistory.addEvent(serial, {
        type: 'STOP',
        status: 'offline',
        description: 'ONU parada manualmente'
      });
      
      return { message: 'ONU parada com sucesso' };
    }
    
    try {
      await this.connection.execute(`onu stop ${serial}`);
      
      onuHistory.addEvent(serial, {
        type: 'STOP',
        status: 'offline',
        description: 'ONU parada manualmente'
      });
      
      return { message: 'ONU parada com sucesso' };
    } catch (error) {
      onuHistory.addEvent(serial, {
        type: 'ERROR',
        status: 'error',
        description: `Erro ao parar ONU: ${error.message}`
      });
      
      throw new Error(`Erro ao parar ONU: ${error.message}`);
    }
  }

  async rebootONU(serial) {
    if (this.isSimulationMode) {
      const onu = this.mockData.onus.find(o => o.sn === serial);
      if (!onu) {
        throw new Error('ONU não encontrada');
      }
      onu.status = 'rebooting';
      
      onuHistory.addEvent(serial, {
        type: 'REBOOT',
        status: 'rebooting',
        description: 'ONU reiniciando manualmente'
      });
      
      setTimeout(() => {
        onu.status = 'online';
        onuHistory.addEvent(serial, {
          type: 'STATUS_CHANGE',
          status: 'online',
          description: 'ONU reiniciada com sucesso'
        });
      }, 5000);
      
      return { message: 'ONU reiniciando' };
    }
    
    try {
      await this.connection.execute(`onu reboot ${serial}`);
      
      onuHistory.addEvent(serial, {
        type: 'REBOOT',
        status: 'rebooting',
        description: 'ONU reiniciando manualmente'
      });
      
      return { message: 'ONU reiniciando' };
    } catch (error) {
      onuHistory.addEvent(serial, {
        type: 'ERROR',
        status: 'error',
        description: `Erro ao reiniciar ONU: ${error.message}`
      });
      
      throw new Error(`Erro ao reiniciar ONU: ${error.message}`);
    }
  }

  async configureONU(serial, config) {
    if (this.isSimulationMode) {
      const onu = this.mockData.onus.find(o => o.sn === serial);
      if (!onu) {
        throw new Error('ONU não encontrada');
      }
      Object.assign(onu, config);
      
      onuHistory.addEvent(serial, {
        type: 'CONFIGURE',
        config,
        description: 'Configuração da ONU atualizada'
      });
      
      return { message: 'ONU configurada com sucesso' };
    }
    
    try {
      // Valida as configurações
      if (config.lineProfile && !/^\d+$/.test(config.lineProfile)) {
        throw new Error('Line profile inválido');
      }
      if (config.srvProfile && !/^\d+$/.test(config.srvProfile)) {
        throw new Error('Service profile inválido');
      }
      if (config.nativeVlan && (config.nativeVlan < 1 || config.nativeVlan > 4094)) {
        throw new Error('VLAN nativa inválida');
      }

      // Aplica as configurações
      if (config.lineProfile) {
        await this.connection.execute(`onu line-profile ${serial} ${config.lineProfile}`);
      }
      if (config.srvProfile) {
        await this.connection.execute(`onu service-profile ${serial} ${config.srvProfile}`);
      }
      if (config.nativeVlan) {
        await this.connection.execute(`onu vlan ${serial} ${config.nativeVlan}`);
      }
      
      onuHistory.addEvent(serial, {
        type: 'CONFIGURE',
        config,
        description: 'Configuração da ONU atualizada'
      });

      return { message: 'ONU configurada com sucesso' };
    } catch (error) {
      onuHistory.addEvent(serial, {
        type: 'ERROR',
        status: 'error',
        description: `Erro ao configurar ONU: ${error.message}`,
        config
      });
      
      throw new Error(`Erro ao configurar ONU: ${error.message}`);
    }
  }

  async getONUStatus(serial) {
    if (this.isSimulationMode) {
      const onu = this.mockData.onus.find(o => o.sn === serial);
      if (!onu) {
        throw new Error('ONU não encontrada');
      }
      return {
        status: onu.status,
        signal: onu.signal,
        temperature: Math.floor(Math.random() * 20) + 35,
        uptime: '10 days, 2 hours',
        ports: [
          {
            name: 'eth_0/1',
            adminState: 'Enabled',
            mode: 'LAN',
            dhcp: 'No control'
          },
          {
            name: 'eth_0/2',
            adminState: 'Enabled',
            mode: 'LAN',
            dhcp: 'No control'
          },
          {
            name: 'eth_0/3',
            adminState: 'Enabled',
            mode: 'LAN',
            dhcp: 'No control'
          },
          {
            name: 'eth_0/4',
            adminState: 'Enabled',
            mode: 'LAN',
            dhcp: 'No control'
          }
        ],
        voip: {
          enabled: onu.voip || false,
          number: onu.voip ? '555-0123' : null,
          status: onu.voip ? 'Registered' : 'Disabled'
        },
        tv: {
          enabled: onu.tv || false,
          channels: onu.tv ? 'Basic Package' : null,
          status: onu.tv ? 'Active' : 'Disabled'
        }
      };
    }
    
    try {
      const status = await this.connection.execute(`show onu status ${serial}`);
      const signal = await this.connection.execute(`show onu optical-info ${serial}`);
      const ports = await this.connection.execute(`show onu port-config ${serial}`);
      const services = await this.connection.execute(`show onu service-config ${serial}`);
      
      return this.parseONUStatus(status, signal, ports, services);
    } catch (error) {
      throw new Error(`Erro ao obter status da ONU: ${error.message}`);
    }
  }

  async configureONUPort(serial, port, config) {
    if (this.isSimulationMode) {
      const onu = this.mockData.onus.find(o => o.sn === serial);
      if (!onu) {
        throw new Error('ONU não encontrada');
      }
      return { 
        message: `Porta ${port} configurada com sucesso`,
        config
      };
    }
    
    try {
      // Valida as configurações da porta
      if (!config.adminState || !['Enabled', 'Disabled'].includes(config.adminState)) {
        throw new Error('Estado administrativo inválido');
      }
      if (!config.mode || !['LAN', 'WAN'].includes(config.mode)) {
        throw new Error('Modo de operação inválido');
      }
      if (!config.dhcp || !['No control', 'Snooping', 'Relay'].includes(config.dhcp)) {
        throw new Error('Configuração DHCP inválida');
      }

      // Aplica as configurações
      await this.connection.execute(`onu port ${serial} ${port} admin-state ${config.adminState}`);
      await this.connection.execute(`onu port ${serial} ${port} mode ${config.mode}`);
      await this.connection.execute(`onu port ${serial} ${port} dhcp ${config.dhcp}`);

      return { 
        message: `Porta ${port} configurada com sucesso`,
        config
      };
    } catch (error) {
      throw new Error(`Erro ao configurar porta da ONU: ${error.message}`);
    }
  }

  parseONUStatus(status, signal, ports, services) {
    // TODO: Implementar o parser para os comandos reais da OLT
    return {
      status: 'online',
      signal: '-20dBm',
      temperature: 45,
      uptime: '10 days, 2 hours',
      ports: [
        {
          name: 'eth_0/1',
          adminState: 'Enabled',
          mode: 'LAN',
          dhcp: 'No control'
        }
      ],
      voip: {
        enabled: false,
        number: null,
        status: 'Disabled'
      },
      tv: {
        enabled: false,
        channels: null,
        status: 'Disabled'
      }
    };
  }
}

// Exporta uma única instância do serviço
module.exports = new OLTService(); 