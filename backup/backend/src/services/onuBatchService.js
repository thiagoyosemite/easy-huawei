const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const onuHistoryService = require('./onuHistoryService');
const oltService = require('./oltService');

class ONUBatchService {
  constructor() {
    this.batchOperations = new Map();
    this.validOperationTypes = ['start', 'stop', 'reboot', 'configure'];
  }

  async createBatchOperation(operations) {
    // Validar operações
    this._validateOperations(operations);

    const batchOperation = {
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date(),
      operations: operations.map(op => ({
        ...op,
        status: 'pending',
        error: null,
        startedAt: null,
        completedAt: null
      }))
    };

    this.batchOperations.set(batchOperation.id, batchOperation);
    return batchOperation;
  }

  async processBatchOperation(batchId) {
    const operation = this.getBatchOperation(batchId);
    
    if (operation.status !== 'pending') {
      throw new Error('Operação já foi processada ou está em andamento');
    }

    // Atualizar status para em progresso
    operation.status = 'in_progress';
    operation.startedAt = new Date();

    try {
      // Processar cada operação sequencialmente
      for (const op of operation.operations) {
        op.status = 'in_progress';
        op.startedAt = new Date();

        try {
          switch (op.type) {
            case 'start':
              await oltService.startONU(op.serial);
              break;
            case 'stop':
              await oltService.stopONU(op.serial);
              break;
            case 'reboot':
              await oltService.rebootONU(op.serial);
              break;
            case 'configure':
              await oltService.configureONU(op.serial, op.config);
              break;
            default:
              throw new Error(`Tipo de operação não suportado: ${op.type}`);
          }

          op.status = 'completed';
          op.completedAt = new Date();
        } catch (error) {
          op.status = 'failed';
          op.error = error.message;
          op.completedAt = new Date();
        }
      }

      // Verificar se todas as operações foram completadas com sucesso
      const allCompleted = operation.operations.every(op => op.status === 'completed');
      operation.status = allCompleted ? 'completed' : 'completed_with_errors';
      operation.completedAt = new Date();

    } catch (error) {
      operation.status = 'failed';
      operation.error = error.message;
      operation.completedAt = new Date();
      throw error;
    }

    return operation;
  }

  listBatchOperations({ status, startDate, endDate } = {}) {
    let operations = Array.from(this.batchOperations.values());

    if (status) {
      operations = operations.filter(op => op.status === status);
    }

    if (startDate) {
      operations = operations.filter(op => op.createdAt >= startDate);
    }

    if (endDate) {
      operations = operations.filter(op => op.createdAt <= endDate);
    }

    return operations;
  }

  getBatchOperation(batchId) {
    const operation = this.batchOperations.get(batchId);
    if (!operation) {
      throw new Error('Operação em lote não encontrada');
    }
    return operation;
  }

  async clearBatchOperation(batchId) {
    const operation = this.getBatchOperation(batchId);
    
    if (operation.status === 'in_progress') {
      throw new Error('Não é possível remover uma operação em progresso');
    }

    const deleted = this.batchOperations.delete(batchId);
    if (!deleted) {
      throw new Error('Operação em lote não encontrada');
    }
  }

  _validateOperations(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new Error('É necessário fornecer pelo menos uma operação');
    }

    operations.forEach(operation => {
      if (!this.validOperationTypes.includes(operation.type)) {
        throw new Error(`Tipo de operação inválido: ${operation.type}`);
      }

      if (!operation.serial) {
        throw new Error('Serial é obrigatório para todas as operações');
      }
    });
  }
}

module.exports = new ONUBatchService(); 