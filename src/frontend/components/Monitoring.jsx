import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Monitoring() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 segundos

  useEffect(() => {
    fetchONUSignals();
    const interval = setInterval(fetchONUSignals, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchONUSignals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/onus/signals');
      setOnus(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados das ONUs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSignalQuality = (rxPower) => {
    const power = parseFloat(rxPower);
    if (power >= -15) return 'Excelente';
    if (power >= -20) return 'Bom';
    if (power >= -25) return 'Regular';
    return 'Ruim';
  };

  const getSignalColor = (rxPower) => {
    const power = parseFloat(rxPower);
    if (power >= -15) return 'text-green-600';
    if (power >= -20) return 'text-blue-600';
    if (power >= -25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Monitoramento de ONUs</h2>
        <div className="flex items-center space-x-4">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={5000}>5 segundos</option>
            <option value={10000}>10 segundos</option>
            <option value={30000}>30 segundos</option>
            <option value={60000}>1 minuto</option>
          </select>
          <button
            onClick={fetchONUSignals}
            className="p-2 rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serial Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                RX Power (dBm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TX Power (dBm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qualidade
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {onus.map((onu, index) => (
              <tr key={`${onu.slot}-${onu.port}-${onu.onuId}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {`0/${onu.slot}/${onu.port}/${onu.onuId}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {onu.serialNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    onu.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {onu.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {onu.rxPower}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {onu.txPower}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${getSignalColor(onu.rxPower)}`}>
                  {getSignalQuality(onu.rxPower)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 