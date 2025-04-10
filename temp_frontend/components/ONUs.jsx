import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ONUs() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchONUs = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3000/api/onus");
        setOnus(response.data || []);
      } catch (err) {
        console.error("Erro ao buscar ONUs:", err);
        setError("Não foi possível carregar as ONUs. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchONUs();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Carregando ONUs...</p>
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

  if (onus.length === 0) {
    return (
      <div className="text-center py-4 bg-gray-50 rounded-md">
        <p className="text-gray-600">Nenhuma ONU encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onus.map((onu) => (
        <div
          key={`${onu.frame}-${onu.slot}-${onu.port}-${onu.onuId}`}
          className="bg-white p-4 rounded-lg shadow border border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">Serial: {onu.sn}</h3>
              <p className="text-sm text-gray-500">
                Porta: {onu.frame}/{onu.slot}/{onu.port} - ID: {onu.onuId}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                onu.status?.toLowerCase() === "online" || onu.status?.toLowerCase() === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {onu.status || "Desconhecido"}
            </span>
          </div>
          {onu.description && (
            <p className="mt-2 text-sm text-gray-600">{onu.description}</p>
          )}
        </div>
      ))}
    </div>
  );
} 