
/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PasswordRecovery from '../PasswordRecovery';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn()
    }
  }
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('PasswordRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires email to be provided', async () => {
    render(<PasswordRecovery email="" />);
    
    const recoveryButton = screen.getByRole('button', { name: /forgot password/i });
    fireEvent.click(recoveryButton);
    
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Email required'
    }));
  });

  it('validates email format', async () => {
    render(<PasswordRecovery email="invalid-email" />);
    
    const recoveryButton = screen.getByRole('button', { name: /forgot password/i });
    fireEvent.click(recoveryButton);
    
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Invalid email'
    }));
  });

  it('handles successful password recovery request', async () => {
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });
    
    render(<PasswordRecovery email="valid@example.com" />);
    
    const recoveryButton = screen.getByRole('button', { name: /forgot password/i });
    fireEvent.click(recoveryButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Recovery email sent'
      }));
    });
  });

  it('handles error during password recovery request', async () => {
    (supabase.auth.resetPasswordForEmail as any).mockRejectedValue(new Error('Failed to send email'));
    
    render(<PasswordRecovery email="valid@example.com" />);
    
    const recoveryButton = screen.getByRole('button', { name: /forgot password/i });
    fireEvent.click(recoveryButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to send recovery email. Please try again.'
      }));
    });
  });

  it('shows loading state during recovery request', async () => {
    (supabase.auth.resetPasswordForEmail as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<PasswordRecovery email="valid@example.com" />);
    
    const recoveryButton = screen.getByRole('button', { name: /forgot password/i });
    fireEvent.click(recoveryButton);
    
    expect(screen.getByText(/sending recovery email/i)).toBeInTheDocument();
  });
});
