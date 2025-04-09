import { useState, useEffect } from 'react';
import axios from 'axios';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const [settings, setSettings] = useState({
    defaultLineProfile: '1',
    defaultServiceProfile: '1',
    defaultVlan: '100',
    defaultDescription: 'ONU {sn}'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/settings', settings);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-6">
          <Cog6ToothIcon className="h-6 w-6 text-gray-400 mr-2" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Configurações de Provisionamento
          </h3>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="lineProfile" className="block text-sm font-medium text-gray-700">
                Line Profile Padrão
              </label>
              <input
                type="text"
                name="lineProfile"
                id="lineProfile"
                value={settings.defaultLineProfile}
                onChange={(e) => setSettings({ ...settings, defaultLineProfile: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="serviceProfile" className="block text-sm font-medium text-gray-700">
                Service Profile Padrão
              </label>
              <input
                type="text"
                name="serviceProfile"
                id="serviceProfile"
                value={settings.defaultServiceProfile}
                onChange={(e) => setSettings({ ...settings, defaultServiceProfile: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="vlan" className="block text-sm font-medium text-gray-700">
                VLAN Padrão
              </label>
              <input
                type="text"
                name="vlan"
                id="vlan"
                value={settings.defaultVlan}
                onChange={(e) => setSettings({ ...settings, defaultVlan: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição Padrão
              </label>
              <input
                type="text"
                name="description"
                id="description"
                value={settings.defaultDescription}
                onChange={(e) => setSettings({ ...settings, defaultDescription: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">Use {'{sn}'} para incluir o serial number</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 