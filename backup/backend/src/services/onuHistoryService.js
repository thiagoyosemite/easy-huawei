const logger = require('../utils/logger');

class ONUHistoryService {
  constructor() {
    this.history = new Map(); // serial -> array of events
  }

  addEvent(serial, event) {
    if (!this.history.has(serial)) {
      this.history.set(serial, []);
    }

    const timestamp = new Date().toISOString();
    const historyEvent = {
      ...event,
      timestamp,
    };

    this.history.get(serial).push(historyEvent);
    logger.info(`Novo evento registrado para ONU ${serial}:`, historyEvent);

    // Mantém apenas os últimos 100 eventos por ONU
    if (this.history.get(serial).length > 100) {
      this.history.get(serial).shift();
    }
  }

  getHistory(serial, options = {}) {
    const events = this.history.get(serial) || [];
    
    let filteredEvents = [...events];

    // Filtra por tipo de evento
    if (options.eventType) {
      filteredEvents = filteredEvents.filter(event => event.type === options.eventType);
    }

    // Filtra por período
    if (options.startDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) >= new Date(options.startDate)
      );
    }
    if (options.endDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) <= new Date(options.endDate)
      );
    }

    // Ordena por data (mais recente primeiro)
    filteredEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limita o número de resultados
    if (options.limit) {
      filteredEvents = filteredEvents.slice(0, options.limit);
    }

    return filteredEvents;
  }

  getMetrics(serial) {
    const events = this.history.get(serial) || [];
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    return {
      total: events.length,
      last24h: events.filter(e => new Date(e.timestamp) >= oneDayAgo).length,
      lastWeek: events.filter(e => new Date(e.timestamp) >= oneWeekAgo).length,
      byType: events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {}),
      lastEvent: events[events.length - 1] || null
    };
  }

  getAllMetrics() {
    const metrics = {
      totalEvents: 0,
      activeONUs: this.history.size,
      eventsByType: {},
      recentActivity: {
        last24h: 0,
        lastWeek: 0
      }
    };

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    this.history.forEach((events, serial) => {
      metrics.totalEvents += events.length;

      events.forEach(event => {
        // Contagem por tipo
        metrics.eventsByType[event.type] = (metrics.eventsByType[event.type] || 0) + 1;

        // Contagem por período
        const eventDate = new Date(event.timestamp);
        if (eventDate >= oneDayAgo) {
          metrics.recentActivity.last24h++;
        }
        if (eventDate >= oneWeekAgo) {
          metrics.recentActivity.lastWeek++;
        }
      });
    });

    return metrics;
  }

  getRecentEvents(serial, limit = 10) {
    const onuHistory = this.getHistory(serial);
    return onuHistory.slice(-limit);
  }

  clearHistory(serial) {
    this.history.delete(serial);
    logger.info(`Histórico limpo para ONU ${serial}`);
  }

  // Métodos para análise de eventos
  getFailureEvents(serial) {
    return this.getHistory(serial).filter(event => 
      event.type === 'error' || event.status === 'failed'
    );
  }

  getConfigurationEvents(serial) {
    return this.getHistory(serial).filter(event => 
      event.type === 'configuration'
    );
  }

  getStatusChanges(serial) {
    return this.getHistory(serial).filter(event => 
      event.type === 'status_change'
    );
  }

  // Análise de tendências
  getEventCounts(serial, timeframe = '24h') {
    const history = this.getHistory(serial);
    const now = new Date();
    const timeframeMs = this.parseTimeframe(timeframe);
    const cutoff = new Date(now.getTime() - timeframeMs);

    const recentEvents = history.filter(event => 
      new Date(event.timestamp) > cutoff
    );

    return {
      total: recentEvents.length,
      byType: this.countByType(recentEvents),
      byStatus: this.countByStatus(recentEvents)
    };
  }

  parseTimeframe(timeframe) {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));

    switch(unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: throw new Error('Timeframe inválido');
    }
  }

  countByType(events) {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});
  }

  countByStatus(events) {
    return events.reduce((acc, event) => {
      if (event.status) {
        acc[event.status] = (acc[event.status] || 0) + 1;
      }
      return acc;
    }, {});
  }
}

// Exporta uma única instância do serviço
module.exports = new ONUHistoryService(); 