import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3002/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Erro na resposta:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Erro na requisição:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição
      console.error('Erro:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
