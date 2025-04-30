const oltService = require('../oltService');
const oltCommands = require('../oltCommands');
const oltConnection = require('../oltConnection');

// Mock dos módulos
jest.mock('../oltCommands');
jest.mock('../oltConnection');
jest.mock('../../logger');

describe('OLTService', () => {
  let oltService;

  beforeEach(() => {
    oltService = new oltService();
    oltService.isSimulationMode = true;
    oltService.mockData = {
      onus: [
        {
          sn: 'HWTC-123456',
          status: 'offline',
          signal: '-20dBm',
          voip: false,
          tv: false
        }
      ]
    };
  });

  describe('initialize', () => {
    it('deve inicializar o serviço corretamente', async () => {
      const mockCommands = ['command1', 'command2'];
      oltCommands.enterConfigMode.mockResolvedValue(mockCommands);
      oltConnection.executeCommand.mockResolvedValue('OK');

      await oltService.initialize();

      expect(oltConnection.connect).toHaveBeenCalled();
      expect(oltCommands.enterConfigMode).toHaveBeenCalled();
      expect(oltConnection.executeCommand).toHaveBeenCalledTimes(mockCommands.length);
    });

    it('deve lançar erro se a conexão falhar', async () => {
      oltConnection.connect.mockRejectedValue(new Error('Falha na conexão'));

      await expect(oltService.initialize()).rejects.toThrow('Falha na conexão');
    });
  });

  describe('discoverUnauthorizedONUs', () => {
    const validPort = '0/1/1';
    const mockCommands = ['show onu-info'];
    const mockResponse = 'Serial: HWTC12345678';

    beforeEach(() => {
      oltCommands.validatePort.mockReturnValue(true);
      oltCommands.discoverONUs.mockResolvedValue(mockCommands);
      oltConnection.executeCommand.mockResolvedValue(mockResponse);
    });

    it('deve descobrir ONUs não autorizadas com sucesso', async () => {
      const result = await oltService.discoverUnauthorizedONUs(validPort);

      expect(result).toHaveProperty('port', validPort);
      expect(result).toHaveProperty('onus');
      expect(Array.isArray(result.onus)).toBe(true);
    });

    it('deve validar o formato da porta', async () => {
      oltCommands.validatePort.mockReturnValue(false);

      await expect(oltService.discoverUnauthorizedONUs('invalid-port'))
        .rejects.toThrow('Formato de porta inválido');
    });

    it('deve usar modo de simulação quando ativado', async () => {
      process.env.SIMULATION_MODE = 'true';
      const result = await oltService.discoverUnauthorizedONUs(validPort);

      expect(result.onus[0]).toHaveProperty('serial');
      expect(result.onus[0]).toHaveProperty('type');
      expect(result.onus[0]).toHaveProperty('status');
      expect(oltConnection.executeCommand).not.toHaveBeenCalled();
    });
  });

  describe('authorizeONU', () => {
    const validPort = '0/1/1';
    const validSerial = 'HWTC12345678';
    const validDescription = 'Test ONU';
    const mockAuthCommands = ['auth command'];
    const mockPortCommands = ['port command'];

    beforeEach(() => {
      oltCommands.validatePort.mockReturnValue(true);
      oltCommands.authorizeONU.mockResolvedValue(mockAuthCommands);
      oltCommands.configureONUPorts.mockResolvedValue(mockPortCommands);
      oltConnection.executeCommand.mockResolvedValue('OK');
    });

    it('deve autorizar ONU com sucesso', async () => {
      const result = await oltService.authorizeONU(validPort, validSerial, validDescription);

      expect(result.success).toBe(true);
      expect(result.details).toMatchObject({
        port: validPort,
        serial: validSerial,
        description: validDescription
      });
      expect(oltService.onuDetections.get(validSerial)).toBeDefined();
    });

    it('deve configurar VLAN nativa quando especificada', async () => {
      const options = { nativeVlan: 100 };
      await oltService.authorizeONU(validPort, validSerial, validDescription, options);

      expect(oltCommands.configureONUPorts).toHaveBeenCalledWith(validPort, 1, { nativeVlan: 100 });
      expect(oltConnection.executeCommand).toHaveBeenCalledTimes(
        mockAuthCommands.length + mockPortCommands.length
      );
    });

    it('deve validar o formato da porta', async () => {
      oltCommands.validatePort.mockReturnValue(false);

      await expect(oltService.authorizeONU('invalid-port', validSerial, validDescription))
        .rejects.toThrow('Formato de porta inválido');
    });
  });

  describe('configureVLAN', () => {
    const validVlanId = 100;
    const validDescription = 'Test VLAN';
    const validPorts = ['0/1/1', '0/1/2'];
    const mockVlanCommands = ['vlan command'];
    const mockServicePortCommand = 'service-port command';

    beforeEach(() => {
      oltCommands.validateVlan.mockReturnValue(true);
      oltCommands.configureVLAN.mockResolvedValue(mockVlanCommands);
      oltCommands.configureServicePort.mockResolvedValue(mockServicePortCommand);
      oltConnection.executeCommand.mockResolvedValue('OK');
    });

    it('deve configurar VLAN com sucesso', async () => {
      const result = await oltService.configureVLAN(validVlanId, validDescription, validPorts);

      expect(result.success).toBe(true);
      expect(result.details).toMatchObject({
        vlanId: validVlanId,
        description: validDescription,
        ports: validPorts
      });
    });

    it('deve validar o ID da VLAN', async () => {
      oltCommands.validateVlan.mockReturnValue(false);

      await expect(oltService.configureVLAN(4096, validDescription))
        .rejects.toThrow('VLAN ID inválido');
    });

    it('deve configurar service-ports para cada porta especificada', async () => {
      await oltService.configureVLAN(validVlanId, validDescription, validPorts);

      expect(oltCommands.configureServicePort).toHaveBeenCalledTimes(validPorts.length);
      expect(oltConnection.executeCommand).toHaveBeenCalledTimes(
        mockVlanCommands.length + mockServicePortCommand.length
      );
    });
  });

  describe('configurePort', () => {
    it('deve configurar uma porta com sucesso', () => {
      const board = 1;
      const port = 2;
      const config = {
        speed: '2.5G',
        mode: 'auto',
        enabled: true
      };

      oltService.configurePort(board, port, config);
      const stored = oltService.getPortConfiguration(board, port);

      expect(stored).toBeTruthy();
      expect(stored.speed).toBe(config.speed);
      expect(stored.mode).toBe(config.mode);
      expect(stored.enabled).toBe(config.enabled);
      expect(stored.lastUpdated).toBeInstanceOf(Date);
    });

    it('deve rejeitar configuração inválida', () => {
      expect(() => {
        oltService.configurePort(1, 2, null);
      }).toThrow('Configuração inválida');
    });
  });

  describe('listPortConfigurations', () => {
    it('deve listar todas as configurações de portas', () => {
      const configs = [
        { board: 1, port: 1, config: { speed: '1G', mode: 'auto' } },
        { board: 1, port: 2, config: { speed: '2.5G', mode: 'manual' } }
      ];

      configs.forEach(({ board, port, config }) => {
        oltService.configurePort(board, port, config);
      });

      const list = oltService.listPortConfigurations();
      expect(list).toHaveLength(2);
      expect(list[0]).toHaveProperty('speed');
      expect(list[0]).toHaveProperty('mode');
      expect(list[0]).toHaveProperty('lastUpdated');
      expect(list[0]).toHaveProperty('port');
    });

    it('deve retornar lista vazia quando não há configurações', () => {
      const list = oltService.listPortConfigurations();
      expect(list).toHaveLength(0);
    });
  });

  describe('startONU', () => {
    it('deve iniciar uma ONU existente', async () => {
      const result = await oltService.startONU('HWTC-123456');
      expect(result.message).toBe('ONU iniciada com sucesso');
      expect(oltService.mockData.onus[0].status).toBe('online');
    });

    it('deve lançar erro ao tentar iniciar uma ONU inexistente', async () => {
      await expect(oltService.startONU('INVALID-SN'))
        .rejects
        .toThrow('ONU não encontrada');
    });
  });

  describe('stopONU', () => {
    it('deve parar uma ONU existente', async () => {
      oltService.mockData.onus[0].status = 'online';
      const result = await oltService.stopONU('HWTC-123456');
      expect(result.message).toBe('ONU parada com sucesso');
      expect(oltService.mockData.onus[0].status).toBe('offline');
    });

    it('deve lançar erro ao tentar parar uma ONU inexistente', async () => {
      await expect(oltService.stopONU('INVALID-SN'))
        .rejects
        .toThrow('ONU não encontrada');
    });
  });

  describe('rebootONU', () => {
    it('deve reiniciar uma ONU existente', async () => {
      const result = await oltService.rebootONU('HWTC-123456');
      expect(result.message).toBe('ONU reiniciando');
      expect(oltService.mockData.onus[0].status).toBe('rebooting');
      
      // Aguarda o reboot simulado
      await new Promise(resolve => setTimeout(resolve, 5500));
      expect(oltService.mockData.onus[0].status).toBe('online');
    });

    it('deve lançar erro ao tentar reiniciar uma ONU inexistente', async () => {
      await expect(oltService.rebootONU('INVALID-SN'))
        .rejects
        .toThrow('ONU não encontrada');
    });
  });

  describe('configureONU', () => {
    it('deve configurar uma ONU existente com sucesso', async () => {
      const config = {
        lineProfile: '1',
        srvProfile: '2',
        nativeVlan: 100
      };

      const result = await oltService.configureONU('HWTC-123456', config);
      expect(result.message).toBe('ONU configurada com sucesso');
    });

    it('deve validar o formato do line profile', async () => {
      const config = {
        lineProfile: 'invalid'
      };

      await expect(oltService.configureONU('HWTC-123456', config))
        .rejects
        .toThrow('Line profile inválido');
    });

    it('deve validar o formato do service profile', async () => {
      const config = {
        srvProfile: 'invalid'
      };

      await expect(oltService.configureONU('HWTC-123456', config))
        .rejects
        .toThrow('Service profile inválido');
    });

    it('deve validar o range da VLAN nativa', async () => {
      const config = {
        nativeVlan: 5000
      };

      await expect(oltService.configureONU('HWTC-123456', config))
        .rejects
        .toThrow('VLAN nativa inválida');
    });
  });

  describe('getONUStatus', () => {
    it('deve retornar o status completo de uma ONU existente', async () => {
      const status = await oltService.getONUStatus('HWTC-123456');
      
      expect(status).toMatchObject({
        status: expect.any(String),
        signal: expect.any(String),
        temperature: expect.any(Number),
        uptime: expect.any(String),
        ports: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            adminState: expect.any(String),
            mode: expect.any(String),
            dhcp: expect.any(String)
          })
        ]),
        voip: expect.objectContaining({
          enabled: expect.any(Boolean),
          number: null,
          status: expect.any(String)
        }),
        tv: expect.objectContaining({
          enabled: expect.any(Boolean),
          channels: null,
          status: expect.any(String)
        })
      });
    });

    it('deve lançar erro ao tentar obter status de uma ONU inexistente', async () => {
      await expect(oltService.getONUStatus('INVALID-SN'))
        .rejects
        .toThrow('ONU não encontrada');
    });
  });

  describe('configureONUPort', () => {
    it('deve configurar uma porta de ONU com sucesso', async () => {
      const config = {
        adminState: 'Enabled',
        mode: 'LAN',
        dhcp: 'No control'
      };

      const result = await oltService.configureONUPort('HWTC-123456', 'eth_0/1', config);
      expect(result.message).toBe('Porta eth_0/1 configurada com sucesso');
      expect(result.config).toEqual(config);
    });

    it('deve validar o estado administrativo da porta', async () => {
      const config = {
        adminState: 'Invalid',
        mode: 'LAN',
        dhcp: 'No control'
      };

      await expect(oltService.configureONUPort('HWTC-123456', 'eth_0/1', config))
        .rejects
        .toThrow('Estado administrativo inválido');
    });

    it('deve validar o modo de operação da porta', async () => {
      const config = {
        adminState: 'Enabled',
        mode: 'Invalid',
        dhcp: 'No control'
      };

      await expect(oltService.configureONUPort('HWTC-123456', 'eth_0/1', config))
        .rejects
        .toThrow('Modo de operação inválido');
    });

    it('deve validar a configuração DHCP da porta', async () => {
      const config = {
        adminState: 'Enabled',
        mode: 'LAN',
        dhcp: 'Invalid'
      };

      await expect(oltService.configureONUPort('HWTC-123456', 'eth_0/1', config))
        .rejects
        .toThrow('Configuração DHCP inválida');
    });

    it('deve lançar erro ao tentar configurar porta de uma ONU inexistente', async () => {
      const config = {
        adminState: 'Enabled',
        mode: 'LAN',
        dhcp: 'No control'
      };

      await expect(oltService.configureONUPort('INVALID-SN', 'eth_0/1', config))
        .rejects
        .toThrow('ONU não encontrada');
    });
  });
}); 