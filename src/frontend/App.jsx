import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UnauthorizedONUs from './components/UnauthorizedONUs';
import ONUDetails from './components/ONUDetails';

function App() {
  const [selectedView, setSelectedView] = useState('unauthorized');
  const [selectedONU, setSelectedONU] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />

        {/* Main Content */}
        <div className="flex-1">
          <Header />
          <main className="p-6">
            {selectedView === 'unauthorized' && (
              <UnauthorizedONUs onSelectONU={setSelectedONU} />
            )}
            {selectedView === 'onu-details' && selectedONU && (
              <ONUDetails onu={selectedONU} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App; 