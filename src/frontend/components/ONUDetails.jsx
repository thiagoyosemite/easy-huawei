import { useState, useEffect } from 'react';
import axios from 'axios';
import { SignalIcon, WifiIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function ONUDetails({ onu }) {
  const [details, setDetails] = useState(null);
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (onu) {
      fetchONUDetails();
      fetchONUSignal();
    }
  }, [onu]);

  const fetchONUDetails = async () => {
    try {
      const response = await axios.get(`/api/onu/${onu.frame}/${onu.slot}/${onu.port}/${onu.onuId}`);
      setDetails(response.data.data);
    } catch (err) {
      setError('Erro ao carregar detalhes da ONU');
      console.error(err);
    }
  };

  const fetchONUSignal = async () => {
    try {
      const response = await axios.get(`/api/onu/${onu.frame}/${onu.slot}/${onu.port}/${onu.onuId}/signal`);
      setSignal(response.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Detalhes da ONU
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {onu.sn}
        </p>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SignalIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Sinal Rx
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {signal?.rxPower || 'N/A'} dBm
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <WifiIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Status
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {details?.status || 'N/A'}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900">Configuração</h4>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Porta</dt>
              <dd className="mt-1 text-sm text-gray-900">{`${onu.frame}/${onu.slot}/${onu.port}`}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{onu.onuId}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Modelo</dt>
              <dd className="mt-1 text-sm text-gray-900">{details?.model || 'N/A'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Firmware</dt>
              <dd className="mt-1 text-sm text-gray-900">{details?.firmware || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 