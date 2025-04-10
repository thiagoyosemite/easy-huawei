import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ONUs from './components/ONUs';

function App() {
  const [selectedView, setSelectedView] = useState('dashboard');

  const renderContent = () => {
    switch (selectedView) {
      case 'dashboard':
        return <Dashboard />;
      case 'onus':
        return <ONUs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-purple-600 mb-2">Easy Huawei</h1>
        <p className="text-gray-600 mb-6">Aplicação para gerenciamento de OLTs Huawei</p>
        
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setSelectedView('dashboard')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              selectedView === 'dashboard'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setSelectedView('onus')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              selectedView === 'onus'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            ONUs
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}

export default App; 