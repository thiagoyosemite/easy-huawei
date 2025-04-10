import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnauthorizedONUs from '../UnauthorizedONUs';
import api from '../../api';

// Mock do módulo api
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

describe('UnauthorizedONUs', () => {
  const mockOnus = [
    {
      sn: 'ABCD1234',
      port: '0/1/1',
      firstSeen: '2024-03-20T10:00:00Z'
    },
    {
      sn: 'EFGH5678',
      port: '0/1/2',
      firstSeen: '2024-03-20T11:00:00Z'
    }
  ];

  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
    // Mock padrão para a chamada GET
    api.get.mockResolvedValue({ data: mockOnus });
  });

  test('renderiza o componente corretamente', async () => {
    render(<UnauthorizedONUs />);
    
    // Aguarda o carregamento dos dados primeiro
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Verifica se o campo de busca está presente
    expect(screen.getByPlaceholderText('Buscar ONU...')).toBeInTheDocument();
    
    // Verifica se os dados foram carregados
    expect(screen.getByText('ABCD1234')).toBeInTheDocument();
    
    // Verifica se os botões de ação estão presentes
    expect(screen.getAllByText('Provisionar')).toHaveLength(2);
  });

  test('filtra ONUs corretamente', async () => {
    render(<UnauthorizedONUs />);
    
    // Aguarda o carregamento dos dados
    await waitFor(() => {
      expect(screen.getByText('ABCD1234')).toBeInTheDocument();
    });
    
    // Digita no campo de busca
    const searchInput = screen.getByPlaceholderText('Buscar ONU...');
    fireEvent.change(searchInput, { target: { value: 'ABCD' } });
    
    // Verifica se apenas a ONU correspondente é exibida
    expect(screen.getByText('ABCD1234')).toBeInTheDocument();
    expect(screen.queryByText('EFGH5678')).not.toBeInTheDocument();
  });

  test('abre o diálogo de provisionamento', async () => {
    render(<UnauthorizedONUs />);
    
    // Aguarda o carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Clica no botão de provisionar
    const provisionButtons = screen.getAllByText('Provisionar');
    fireEvent.click(provisionButtons[0]);
    
    // Verifica se o diálogo foi aberto
    expect(screen.getByText('Provisionar ONU')).toBeInTheDocument();
    expect(screen.getByText('ABCD1234')).toBeInTheDocument();
  });

  test('valida campos do formulário de provisionamento', async () => {
    render(<UnauthorizedONUs />);
    
    // Aguarda o carregamento dos dados e abre o diálogo
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    const provisionButtons = screen.getAllByText('Provisionar');
    fireEvent.click(provisionButtons[0]);
    
    // Tenta submeter com campos vazios
    const submitButton = screen.getByRole('button', { name: 'Confirmar' });
    expect(submitButton).toBeDisabled();
    
    // Preenche descrição inválida
    const descriptionInput = screen.getByRole('textbox', { name: 'Descrição da ONU' });
    fireEvent.change(descriptionInput, { target: { value: 'ab' } });
    expect(screen.getByText('Descrição deve ter pelo menos 3 caracteres')).toBeInTheDocument();
    
    // Preenche porta inválida
    const portInput = screen.getByRole('textbox', { name: 'Porta da ONU' });
    fireEvent.change(portInput, { target: { value: 'invalid' } });
    expect(screen.getByText('Formato inválido. Use: frame/slot/port (exemplo: 0/1/1)')).toBeInTheDocument();
  });

  test('provisiona ONU com sucesso', async () => {
    api.post.mockResolvedValueOnce({});
    render(<UnauthorizedONUs />);
    
    // Aguarda o carregamento dos dados e abre o diálogo
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    const provisionButtons = screen.getAllByText('Provisionar');
    fireEvent.click(provisionButtons[0]);
    
    // Preenche os campos corretamente
    const descriptionInput = screen.getByRole('textbox', { name: 'Descrição da ONU' });
    const portInput = screen.getByRole('textbox', { name: 'Porta da ONU' });
    
    fireEvent.change(descriptionInput, { target: { value: 'Cliente Teste' } });
    fireEvent.change(portInput, { target: { value: '0/1/1' } });
    
    // Submete o formulário
    const submitButton = screen.getByRole('button', { name: 'Confirmar' });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/provision-onu', {
        serialNumber: 'ABCD1234',
        port: '0/1/1',
        description: 'Cliente Teste'
      });
    });
    
    // Verifica se a mensagem de sucesso é exibida
    await waitFor(() => {
      expect(screen.getByText('ONU provisionada com sucesso!')).toBeInTheDocument();
    });
  });

  test('exporta dados para CSV', async () => {
    render(<UnauthorizedONUs />);
    
    // Aguarda o carregamento dos dados
    await waitFor(() => {
      expect(screen.getByText('ABCD1234')).toBeInTheDocument();
    });
    
    // Clica no botão de exportar
    const exportButton = screen.getByLabelText('Exportar dados');
    fireEvent.click(exportButton);
    
    // Verifica se a função createObjectURL foi chamada
    expect(URL.createObjectURL).toHaveBeenCalled();
    
    // Verifica se a mensagem de sucesso é exibida
    expect(screen.getByText('Dados exportados com sucesso!')).toBeInTheDocument();
  });

  test('ordena a tabela corretamente', async () => {
    render(<UnauthorizedONUs />);
    
    // Aguarda o carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Clica no cabeçalho da coluna Serial para ordenar
    const serialHeader = screen.getByText('Serial');
    fireEvent.click(serialHeader);
    
    // Aguarda a reordenação
    await waitFor(() => {
      const cells = screen.getAllByRole('cell');
      expect(cells[0]).toHaveTextContent('ABCD1234');
    });
    
    // Clica novamente para inverter a ordem
    fireEvent.click(serialHeader);
    
    // Aguarda a reordenação
    await waitFor(() => {
      const cells = screen.getAllByRole('cell');
      expect(cells[0]).toHaveTextContent('EFGH5678');
    });
  });
}); 