import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import UnauthorizedONUs from './components/UnauthorizedONUs';
import ONUs from './components/ONUs';
import Monitoring from './components/Monitoring';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';

function App() {
  const [selectedView, setSelectedView] = useState('dashboard');

  // Função para renderizar o componente correto baseado na view selecionada
  const renderContent = () => {
    switch (selectedView) {
      case 'dashboard':
        return <Dashboard />;
      case 'unauthorized':
        return <UnauthorizedONUs />;
      case 'onus':
        return <ONUs />;
      case 'monitoring':
        return <Monitoring />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <p>Selecione uma opção no menu lateral</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold mb-4">OLT Manager</h1>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App; 