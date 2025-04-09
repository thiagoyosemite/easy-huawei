import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChartBarIcon, SignalIcon } from '@heroicons/react/24/outline';

export default function ONUMonitoring() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos

  useEffect(() => {
    fetchONUSignals();
    const interval = setInterval(fetchONUSignals, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchONUSignals = async () => {
    try {
      setLoading(true);
      // Primeiro, buscar todas as ONUs autorizadas
      const response = await axios.get('/api/onus');
      const onuList = response.data.data;

      // Para cada ONU, buscar o sinal
      const onusWithSignal = await Promise.all(
        onuList.map(async (onu) => {
          try {
            const signalResponse = await axios.get(
              `/api/onu/${onu.frame}/${onu.slot}/${onu.port}/${onu.onuId}/signal`
            );
            return {
              ...onu,
              signal: signalResponse.data.data,
              status: 'online'
            };
          } catch (error) {
            return {
              ...onu,
              signal: null,
              status: 'offline'
            };
          }
        })
      );

      setOnus(onusWithSignal);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados das ONUs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSignalQuality = (signal) => {
    if (!signal) return 'unknown';
    const rx = parseFloat(signal.rx);
    if (rx >= -25) return 'excellent';
    if (rx >= -28) return 'good';
    if (rx >= -32) return 'fair';
    return 'poor';
  };

  const getSignalColor = (quality) => {
    const colors = {
      excellent: 'text-green-500',
      good: 'text-blue-500',
      fair: 'text-yellow-500',
      poor: 'text-red-500',
      unknown: 'text-gray-500'
    };
    return colors[quality] || colors.unknown;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ChartBarIcon className="h-6 w-6 text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Monitoramento de ONUs</h2>
        </div>
        <div className="flex items-center space-x-4">
          <label htmlFor="refresh" className="text-sm text-gray-600">
            Atualizar a cada:
          </label>
          <select
            id="refresh"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value={10}>10 segundos</option>
            <option value={30}>30 segundos</option>
            <option value={60}>1 minuto</option>
            <option value={300}>5 minutos</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ONU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sinal RX (dBm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sinal TX (dBm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Temperatura
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {onus.map((onu) => {
              const signalQuality = getSignalQuality(onu.signal);
              return (
                <tr key={`${onu.frame}/${onu.slot}/${onu.port}/${onu.onuId}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{onu.description || onu.sn}</div>
                    <div className="text-sm text-gray-500">{onu.sn}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {onu.frame}/{onu.slot}/{onu.port}/{onu.onuId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      onu.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {onu.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium flex items-center ${getSignalColor(signalQuality)}`}>
                      <SignalIcon className="h-5 w-5 mr-1" />
                      {onu.signal ? onu.signal.rx : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {onu.signal ? onu.signal.tx : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {onu.signal ? `${onu.signal.temperature}°C` : 'N/A'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 