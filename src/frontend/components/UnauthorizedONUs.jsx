import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedONUs({ onSelectONU }) {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUnauthorizedONUs();
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchUnauthorizedONUs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnauthorizedONUs = async () => {
    try {
      const response = await axios.get('/api/unauthorized-onus');
      setOnus(response.data.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar ONUs não autorizadas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async (onu) => {
    try {
      await axios.post('/api/provision-onu', {
        frame: onu.frame,
        slot: onu.slot,
        port: onu.port,
        onuId: onu.nextAvailableId || 1, // Você precisará implementar a lógica para obter o próximo ID disponível
        sn: onu.sn,
        description: `ONU ${onu.sn}`,
        lineProfile: 1, // Valores padrão, você pode tornar isso configurável
        serviceProfile: 1,
        vlan: 100
      });
      
      fetchUnauthorizedONUs(); // Atualiza a lista
    } catch (err) {
      console.error('Erro ao provisionar ONU:', err);
      // Adicione tratamento de erro adequado aqui
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {onus.map((onu) => (
          <li key={onu.sn}>
            <div className="px-4 py-4 flex items-center justify-between sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {onu.sn}
                  </div>
                  <div className="text-sm text-gray-500">
                    Porta: {onu.frame}/{onu.slot}/{onu.port}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleProvision(onu)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Provisionar
                </button>
              </div>
            </div>
          </li>
        ))}
        {onus.length === 0 && (
          <li className="px-4 py-5 sm:px-6">
            <div className="text-center text-sm text-gray-500">
              Nenhuma ONU não autorizada encontrada
            </div>
          </li>
        )}
      </ul>
    </div>
  );
} 