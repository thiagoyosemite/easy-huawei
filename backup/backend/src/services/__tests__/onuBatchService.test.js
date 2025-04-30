const ONUBatchService = require('../onuBatchService');
const oltService = require('../oltService');

// Mock do oltService
jest.mock('../oltService', () => ({
  startONU: jest.fn(),
  stopONU: jest.fn(),
  rebootONU: jest.fn(),
  configureONU: jest.fn()
}));

describe('ONUBatchService', () => {
  let batchService;

  beforeEach(() => {
    batchService = new ONUBatchService();
    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('createBatchOperation', () => {
    it('deve criar uma operação em lote com sucesso', () => {
      const operations = [
        { type: 'start', serial: 'ABCD1234' },
        { type: 'reboot', serial: 'EFGH5678' }
      ];

      const batch = batchService.createBatchOperation(operations);

      expect(batch).toMatchObject({
        id: expect.any(String),
        status: 'pending',
        operations: expect.arrayContaining([
          expect.objectContaining({
            type: 'start',
            serial: 'ABCD1234',
            status: 'pending'
          }),
          expect.objectContaining({
            type: 'reboot',
            serial: 'EFGH5678',
            status: 'pending'
          })
        ])
      });
    });

    it('deve rejeitar operações com tipo inválido', () => {
      const operations = [
        { type: 'invalid', serial: 'ABCD1234' }
      ];

      expect(() => {
        batchService.createBatchOperation(operations);
      }).toThrow('Tipo de operação inválido: invalid');
    });

    it('deve rejeitar operações sem serial', () => {
      const operations = [
        { type: 'start' }
      ];

      expect(() => {
        batchService.createBatchOperation(operations);
      }).toThrow('Serial é obrigatório para todas as operações');
    });
  });

  describe('processBatchOperation', () => {
    it('deve processar todas as operações com sucesso', async () => {
      const operations = [
        { type: 'start', serial: 'ABCD1234' },
        { type: 'reboot', serial: 'EFGH5678' }
      ];

      const batch = batchService.createBatchOperation(operations);
      
      oltService.startONU.mockResolvedValueOnce();
      oltService.rebootONU.mockResolvedValueOnce();

      const result = await batchService.processBatchOperation(batch.id);

      expect(result.status).toBe('completed');
      expect(result.operations).toHaveLength(2);
      expect(result.operations[0].status).toBe('completed');
      expect(result.operations[1].status).toBe('completed');
      
      expect(oltService.startONU).toHaveBeenCalledWith('ABCD1234');
      expect(oltService.rebootONU).toHaveBeenCalledWith('EFGH5678');
    });

    it('deve marcar operações individuais como falhas quando ocorrer erro', async () => {
      const operations = [
        { type: 'start', serial: 'ABCD1234' },
        { type: 'reboot', serial: 'EFGH5678' }
      ];

      const batch = batchService.createBatchOperation(operations);
      
      oltService.startONU.mockResolvedValueOnce();
      oltService.rebootONU.mockRejectedValueOnce(new Error('Falha ao reiniciar'));

      const result = await batchService.processBatchOperation(batch.id);

      expect(result.status).toBe('completed_with_errors');
      expect(result.operations[0].status).toBe('completed');
      expect(result.operations[1].status).toBe('failed');
      expect(result.operations[1].error).toBe('Falha ao reiniciar');
    });

    it('não deve permitir processar uma operação que já foi iniciada', async () => {
      const operations = [
        { type: 'start', serial: 'ABCD1234' }
      ];

      const batch = batchService.createBatchOperation(operations);
      
      // Primeira execução
      oltService.startONU.mockResolvedValueOnce();
      await batchService.processBatchOperation(batch.id);

      // Segunda execução
      await expect(batchService.processBatchOperation(batch.id))
        .rejects
        .toThrow('Operação já foi processada ou está em andamento');
    });
  });

  describe('listBatchOperations', () => {
    it('deve listar operações em lote', () => {
      const operations = [
        { type: 'start', serial: 'ABCD1234' }
      ];

      const batch = batchService.createBatchOperation(operations);
      const list = batchService.listBatchOperations();

      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(batch.id);
    });

    it('deve retornar lista vazia quando não há operações', () => {
      const list = batchService.listBatchOperations();
      expect(list).toHaveLength(0);
    });
  });

  describe('getBatchOperation', () => {
    it('deve retornar uma operação específica', () => {
      const operations = [
        { type: 'start', serial: 'ABCD1234' }
      ];

      const batch = batchService.createBatchOperation(operations);
      const retrieved = batchService.getBatchOperation(batch.id);

      expect(retrieved.id).toBe(batch.id);
      expect(retrieved.operations).toHaveLength(1);
    });

    it('deve lançar erro para ID inválido', () => {
      expect(() => {
        batchService.getBatchOperation('invalid-id');
      }).toThrow('Operação em lote não encontrada');
    });
  });
}); 