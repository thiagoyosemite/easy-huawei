import React, { useState } from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Easy Huawei</h1>
        <p className="text-gray-700">
          Aplicação para gerenciamento de OLTs Huawei
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Dashboard
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            ONUs
          </button>
        </div>
      </div>
    </div>
  );
}

export default App; 