const request = require('supertest');
const { app } = require('../index');
const onuBatchService = require('../services/onuBatchService');

jest.mock('../services/onuBatchService');

describe('Batch Operations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/batch-operations', () => {
    it('deve criar uma nova operação em lote com sucesso', async () => {
      const mockOperations = [
        { type: 'start', serial: 'ABCD1234' },
        { type: 'reboot', serial: 'EFGH5678' }
      ];

      const mockBatchOperation = {
        id: '123',
        status: 'pending',
        operations: mockOperations.map(op => ({ ...op, status: 'pending' })),
        createdAt: new Date().toISOString()
      };

      onuBatchService.createBatchOperation.mockResolvedValue(mockBatchOperation);

      const response = await request(app)
        .post('/api/batch-operations')
        .send({ operations: mockOperations });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockBatchOperation);
      expect(onuBatchService.createBatchOperation).toHaveBeenCalledWith(mockOperations);
    });

    it('deve retornar erro 400 quando as operações são inválidas', async () => {
      onuBatchService.createBatchOperation.mockRejectedValue(new Error('Operações inválidas'));

      const response = await request(app)
        .post('/api/batch-operations')
        .send({ operations: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Operações inválidas');
    });
  });

  describe('GET /api/batch-operations', () => {
    it('deve listar operações em lote com filtros', async () => {
      const mockOperations = [
        {
          id: '123',
          status: 'completed',
          operations: [{ type: 'start', serial: 'ABCD1234', status: 'completed' }],
          createdAt: new Date().toISOString()
        }
      ];

      onuBatchService.listBatchOperations.mockReturnValue(mockOperations);

      const response = await request(app)
        .get('/api/batch-operations')
        .query({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOperations);
      expect(onuBatchService.listBatchOperations).toHaveBeenCalledWith({
        status: 'completed',
        startDate: undefined,
        endDate: undefined
      });
    });
  });

  describe('GET /api/batch-operations/:batchId', () => {
    it('deve retornar uma operação em lote específica', async () => {
      const mockOperation = {
        id: '123',
        status: 'completed',
        operations: [{ type: 'start', serial: 'ABCD1234', status: 'completed' }],
        createdAt: new Date().toISOString()
      };

      onuBatchService.getBatchOperation.mockReturnValue(mockOperation);

      const response = await request(app)
        .get('/api/batch-operations/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOperation);
      expect(onuBatchService.getBatchOperation).toHaveBeenCalledWith('123');
    });

    it('deve retornar 404 quando a operação não é encontrada', async () => {
      onuBatchService.getBatchOperation.mockImplementation(() => {
        throw new Error('Operação não encontrada');
      });

      const response = await request(app)
        .get('/api/batch-operations/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Operação não encontrada');
    });
  });

  describe('DELETE /api/batch-operations/:batchId', () => {
    it('deve remover uma operação em lote com sucesso', async () => {
      onuBatchService.clearBatchOperation.mockResolvedValue();

      const response = await request(app)
        .delete('/api/batch-operations/123');

      expect(response.status).toBe(204);
      expect(onuBatchService.clearBatchOperation).toHaveBeenCalledWith('123');
    });

    it('deve retornar 404 quando a operação não é encontrada', async () => {
      onuBatchService.clearBatchOperation.mockRejectedValue(
        new Error('Operação não encontrada')
      );

      const response = await request(app)
        .delete('/api/batch-operations/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Operação não encontrada');
    });

    it('deve retornar 400 quando a operação está em progresso', async () => {
      onuBatchService.clearBatchOperation.mockRejectedValue(
        new Error('Não é possível remover uma operação em progresso')
      );

      const response = await request(app)
        .delete('/api/batch-operations/123');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Não é possível remover uma operação em progresso'
      );
    });
  });
}); 