import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlagList from '../FlagList';
import { useFlags, useToggleFlag, useDeleteFlag } from '../../hooks/useFlags';
import { useAuth } from '../../hooks/useAuth';

// Mock hooks
jest.mock('../../hooks/useFlags', () => ({
  useFlags: jest.fn(),
  useToggleFlag: jest.fn(),
  useDeleteFlag: jest.fn(),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockFlags = [
  {
    key: 'test-flag',
    name: 'Test Flag',
    enabled: true,
    strategy: { type: 'percentage', rolloutPercentage: 50 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    key: 'another-flag',
    name: 'Another Flag',
    enabled: false,
    strategy: { type: 'static' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('FlagList', () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFlags as jest.Mock).mockReturnValue({ data: mockFlags, isLoading: false, isError: false });
    (useToggleFlag as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false });
    (useDeleteFlag as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false });
    (useAuth as jest.Mock).mockReturnValue({ user: { email: 'admin@example.com', roles: ['admin'] } });
  });

  it('renders flags list', () => {
    render(<FlagList />);
    expect(screen.getByText('test-flag')).toBeInTheDocument();
    expect(screen.getByText('Test Flag')).toBeInTheDocument();
    expect(screen.getByText('another-flag')).toBeInTheDocument();
  });

  it('filters flags by search input', () => {
    render(<FlagList />);
    const searchInput = screen.getByPlaceholderText(/Search flags/i);
    
    fireEvent.change(searchInput, { target: { value: 'another' } });
    
    expect(screen.queryByText('test-flag')).not.toBeInTheDocument();
    expect(screen.getByText('another-flag')).toBeInTheDocument();
  });

  it('calls toggle mutation when toggle button clicked', () => {
    render(<FlagList />);
    const toggleButtons = screen.getAllByRole('button');
    // The first two buttons are toggle switches in our row
    fireEvent.click(toggleButtons[0]);
    
    expect(mockMutate).toHaveBeenCalledWith({ key: 'test-flag', enabled: false });
  });

  it('calls delete mutation when delete button clicked and confirmed', () => {
    window.confirm = jest.fn(() => true);
    render(<FlagList />);
    
    const deleteButtons = screen.getAllByTitle('Delete Flag');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockMutate).toHaveBeenCalledWith('test-flag');
  });

  it('disables actions for non-admin users', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: 'user@example.com', roles: ['user'] } });
    render(<FlagList />);
    
    const toggleButtons = screen.getAllByRole('button');
    expect(toggleButtons[0]).toBeDisabled();
    
    expect(screen.queryByTitle('Delete Flag')).not.toBeInTheDocument();
  });
});
