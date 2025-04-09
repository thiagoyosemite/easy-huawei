import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedONUs() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchUnauthorizedONUs();
  }, []);

  const fetchUnauthorizedONUs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/unauthorized-onus');
      setOnus(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao buscar ONUs não autorizadas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async (onu) => {
    try {
      setLoading(true);
      await axios.post('http://localhost:3000/api/onus/provision', {
        slot: onu.slot,
        port: onu.port,
        serialNumber: onu.serialNumber
      });
      
      setSuccess(`ONU ${onu.serialNumber} provisionada com sucesso!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Atualizar lista de ONUs não autorizadas
      await fetchUnauthorizedONUs();
    } catch (err) {
      setError(`Erro ao provisionar ONU ${onu.serialNumber}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">ONUs não autorizadas</h2>
        <button
          onClick={fetchUnauthorizedONUs}
          className="p-2 rounded-full hover:bg-gray-100"
          disabled={loading}
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 p-4 rounded-md">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {loading && onus.length === 0 ? (
        <p>Buscando ONUs não autorizadas...</p>
      ) : onus.length === 0 ? (
        <p>Nenhuma ONU não autorizada encontrada.</p>
      ) : (
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
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {onus.map((onu, index) => (
                <tr key={`${onu.slot}-${onu.port}-${onu.serialNumber}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {`0/${onu.slot}/${onu.port}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {onu.serialNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {onu.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleProvision(onu)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      disabled={loading}
                    >
                      Provisionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 