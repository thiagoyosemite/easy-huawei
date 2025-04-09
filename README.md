# OLT Manager

Sistema de gerenciamento para OLT Huawei via SSH.

## Requisitos

- Node.js 14.x ou superior
- npm 6.x ou superior
- Acesso SSH à OLT Huawei

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```
3. Copie o arquivo de exemplo de configuração:
```bash
cp .env.example .env
```
4. Configure as variáveis de ambiente no arquivo `.env`:
```
OLT_HOST=IP_DA_SUA_OLT
OLT_USERNAME=seu_usuario
OLT_PASSWORD=sua_senha
OLT_PORT=22
PORT=3000
```

## Uso

Para iniciar o servidor:

```bash
node src/index.js
```

### Endpoints disponíveis

- `GET /onus` - Lista todas as ONUs
- `GET /onus/:frame/:slot/:port/:onuId` - Obtém status de uma ONU específica

## Logs

Os logs são salvos em:
- `error.log` - Apenas erros
- `combined.log` - Todos os logs

## Segurança

- Nunca compartilhe seu arquivo `.env`
- Use HTTPS em produção
- Implemente autenticação antes de usar em produção
- Mantenha as dependências atualizadas

## Contribuição

1. Faça um fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request 