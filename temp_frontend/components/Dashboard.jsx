import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3000/api/onus");
        const onus = response.data || [];
        
        const online = onus.filter(onu => 
          onu.status?.toLowerCase() === "online" || 
          onu.status?.toLowerCase() === "active"
        ).length;
        
        setStats({
          total: onus.length,
          online: online,
          offline: onus.length - online
        });
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
        setError("Não foi possível carregar as estatísticas. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-purple-800 font-medium mb-1">Total ONUs</h3>
        <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-green-800 font-medium mb-1">ONUs Online</h3>
        <p className="text-2xl font-bold text-green-600">{stats.online}</p>
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-red-800 font-medium mb-1">ONUs Offline</h3>
        <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
      </div>
    </div>
  );
} 