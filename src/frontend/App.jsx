import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UnauthorizedONUs from './components/UnauthorizedONUs';
import ONUDetails from './components/ONUDetails';

function App() {
  const [selectedView, setSelectedView] = useState('unauthorized');
  const [selectedONU, setSelectedONU] = useState(null);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {selectedView === 'unauthorized' && (
            <UnauthorizedONUs onSelectONU={setSelectedONU} />
          )}
          {selectedView === 'onu-details' && selectedONU && (
            <ONUDetails onu={selectedONU} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App; 