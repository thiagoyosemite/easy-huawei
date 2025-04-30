import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FailedONUs from '../FailedONUs';
import api from '../../api';

jest.mock('../../api');

describe('FailedONUs', () => {
  const mockONUs = [
    {
      serial: 'HWTC1234',
      description: 'ONU 1',
      port: '0/1/1',
      status: 'offline',
      lastEvent: 'los',
      lastSeen: '2024-03-20T10:00:00Z'
    },
    {
      serial: 'HWTC5678',
      description: 'ONU 2',
      port: '0/1/2',
      status: 'offline',
      lastEvent: 'los',
      lastSeen: '2024-03-20T11:00:00Z'
    }
  ];

  beforeEach(() => {
    api.get.mockReset();
  });

  it('deve renderizar o componente com loading inicialmente', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    render(<FailedONUs />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro quando a requisição falha', async () => {
    const errorMessage = 'Erro ao carregar dados';
    api.get.mockRejectedValue({ message: errorMessage });
    
    render(<FailedONUs />);
    
    await waitFor(() => {
      expect(screen.getByText(`Erro ao carregar ONUs com falha física: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('deve renderizar a lista de ONUs com falha física', async () => {
    api.get.mockResolvedValue({ data: mockONUs });
    
    render(<FailedONUs />);
    
    await waitFor(() => {
      expect(screen.getByText('ONUs com Falha Física')).toBeInTheDocument();
    });

    expect(screen.getByText('HWTC1234')).toBeInTheDocument();
    expect(screen.getByText('HWTC5678')).toBeInTheDocument();
  });

  it('deve filtrar ONUs baseado no termo de busca', async () => {
    api.get.mockResolvedValue({ data: mockONUs });
    
    render(<FailedONUs />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar ONU...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar ONU...');
    fireEvent.change(searchInput, { target: { value: 'ONU 1' } });

    expect(screen.getByText('HWTC1234')).toBeInTheDocument();
    expect(screen.queryByText('HWTC5678')).not.toBeInTheDocument();
  });

  it('deve ordenar ONUs quando clicar no cabeçalho da tabela', async () => {
    api.get.mockResolvedValue({ data: mockONUs });
    
    render(<FailedONUs />);
    
    await waitFor(() => {
      expect(screen.getByText('Serial')).toBeInTheDocument();
    });

    const serialHeader = screen.getByText('Serial');
    fireEvent.click(serialHeader);

    const rows = screen.getAllByRole('row');
    const firstRowCells = rows[1].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toBe('HWTC1234');
  });
}); 