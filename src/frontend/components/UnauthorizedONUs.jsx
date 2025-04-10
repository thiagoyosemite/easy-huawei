import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UnauthorizedONUs() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [provisioning, setProvisioning] = useState(null);

  // Função para buscar ONUs não autorizadas
  const fetchUnauthorizedONUs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/api/unauthorized-onus');
      setOnus(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar ONUs não autorizadas:', err);
      setError('Falha ao carregar ONUs não autorizadas. Tente novamente.');
      setLoading(false);
    }
  };

  // Carregar ONUs ao montar o componente
  useEffect(() => {
    fetchUnauthorizedONUs();
  }, []);

  // Função para provisionar uma ONU
  const provisionONU = async (onu) => {
    setProvisioning(onu.sn);
    try {
      // Valores padrão para provisionar
      const payload = {
        frame: onu.frame,
        slot: onu.slot,
        port: onu.port,
        onuId: parseInt(onu.onuId || "1"),
        sn: onu.sn,
        description: `ONU-${onu.sn}`,
        lineProfile: "FTTH",
        serviceProfile: "INTERNET",
        vlan: 100
      };
      
      await axios.post('http://localhost:3000/api/provision-onu', payload);
      
      // Remover a ONU da lista
      setOnus(onus.filter(o => o.sn !== onu.sn));
      setProvisioning(null);
    } catch (err) {
      console.error('Erro ao provisionar ONU:', err);
      setError(`Falha ao provisionar ONU ${onu.sn}. Tente novamente.`);
      setProvisioning(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-yellow-700">ONUs Não Autorizadas</h2>
        <button 
          onClick={fetchUnauthorizedONUs}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Carregando ONUs não autorizadas...</p>
        </div>
      ) : onus.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Nenhuma ONU não autorizada encontrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {onus.map((onu, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{onu.sn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{onu.frame}/{onu.slot}/{onu.port}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => provisionONU(onu)}
                      disabled={provisioning === onu.sn}
                      className={`px-3 py-1 rounded ${
                        provisioning === onu.sn
                          ? 'bg-gray-300 text-gray-700'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {provisioning === onu.sn ? 'Provisionando...' : 'Provisionar'}
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