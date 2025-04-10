import axios from 'axios';

// Cria uma instância do axios com configurações base
const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    timeout: 10000,
});

// Controle de rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 segundo
const MAX_REQUESTS_PER_WINDOW = 5;

// Interceptor para requisições
api.interceptors.request.use(async (config) => {
    const endpoint = config.url;
    const now = Date.now();

    // Limpa entradas antigas do rate limit map
    for (const [key, value] of rateLimitMap.entries()) {
        if (now - value.timestamp > RATE_LIMIT_WINDOW) {
            rateLimitMap.delete(key);
        }
    }

    // Verifica o rate limit para o endpoint
    const rateLimit = rateLimitMap.get(endpoint) || { count: 0, timestamp: now };
    
    if (now - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
        // Nova janela de tempo
        rateLimit.count = 1;
        rateLimit.timestamp = now;
    } else if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
        throw new Error(`Muitas requisições para ${endpoint}. Tente novamente em alguns segundos.`);
    } else {
        rateLimit.count++;
    }
    
    rateLimitMap.set(endpoint, rateLimit);

    // Adiciona token de autenticação se existir
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor para respostas
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Erro do servidor com resposta
            switch (error.response.status) {
                case 401:
                    // Não autorizado - limpa o token e redireciona para login
                    localStorage.removeItem('authToken');
                    // Aqui você pode adicionar lógica de redirecionamento se necessário
                    break;
                case 429:
                    // Rate limit excedido
                    console.warn('Rate limit excedido. Aguarde alguns segundos.');
                    break;
                default:
                    // Outros erros
                    console.error('Erro na requisição:', error.response.data);
            }
        } else if (error.request) {
            // Requisição feita mas sem resposta
            console.error('Sem resposta do servidor:', error.request);
        } else {
            // Erro na configuração da requisição
            console.error('Erro ao configurar requisição:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api; 