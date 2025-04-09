import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ServerIcon,
  ChipIcon,
  SignalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [oltInfo, setOltInfo] = useState(null);
  const [onuStats, setOnuStats] = useState({
    total: 0,
    online: 0,
    offline: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [oltResponse, onusResponse] = await Promise.all([
        axios.get('http://localhost:3000/api/olt/info'),
        axios.get('http://localhost:3000/api/onus')
      ]);

      setOltInfo(oltResponse.data);
      
      const onus = onusResponse.data;
      setOnuStats({
        total: onus.length,
        online: onus.filter(onu => onu.status === 'online').length,
        offline: onus.filter(onu => onu.status === 'offline').length
      });

      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 70) return 'text-red-600';
    if (temp >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p>Carregando informações...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard - Teste FTP</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Total ONUs</h2>
          <p className="text-3xl font-bold text-blue-600">{onuStats.total}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">ONUs Online</h2>
          <p className="text-3xl font-bold text-green-600">{onuStats.online}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">ONUs Offline</h2>
          <p className="text-3xl font-bold text-red-600">{onuStats.offline}</p>
        </div>
      </div>

      {/* Informações da OLT */}
      {oltInfo && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <ServerIcon className="h-6 w-6 mr-2" />
            Informações da OLT
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Modelo</p>
              <p className="text-lg font-medium">{oltInfo.version.model}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Versão do Firmware</p>
              <p className="text-lg font-medium">{oltInfo.version.version}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Temperatura</p>
              <p className={`text-lg font-medium ${getTemperatureColor(oltInfo.temperature)}`}>
                {oltInfo.temperature}°C
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-md font-medium mb-3 flex items-center">
              <ChipIcon className="h-5 w-5 mr-2" />
              Placas Instaladas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oltInfo.boards.map((board, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Slot {board.slot}</p>
                  <p className="text-md font-medium">{board.type}</p>
                  <span className={`text-sm ${
                    board.status === 'normal' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {board.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 