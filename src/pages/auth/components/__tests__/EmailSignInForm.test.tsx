
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import EmailSignInForm from '../EmailSignInForm';
import { supabase } from '@/integrations/supabase/client';
import { useCaptcha } from '@/hooks/useCaptcha';
import { useCaptchaVerification } from '@/hooks/useCaptchaVerification';

// Mock the hooks and Supabase client
vi.mock('@/hooks/useCaptcha', () => ({
  useCaptcha: vi.fn()
}));

vi.mock('@/hooks/useCaptchaVerification', () => ({
  useCaptchaVerification: vi.fn()
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn()
    }
  }
}));

// Mock toast for testing notifications
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('EmailSignInForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToSignUp = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (useCaptcha as any).mockReturnValue({
      executeCaptcha: vi.fn().mockResolvedValue('mock-token'),
      isEnabled: true
    });
    
    (useCaptchaVerification as any).mockReturnValue({
      verifyCaptcha: vi.fn().mockResolvedValue({ success: true })
    });
  });

  const setupForm = () => {
    return render(
      <EmailSignInForm 
        onSuccess={mockOnSuccess} 
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );
  };

  const fillForm = async (email: string, password: string) => {
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(passwordInput, { target: { value: password } });
  };

  it('validates empty fields', async () => {
    setupForm();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.click(submitButton);
    
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Missing fields',
      variant: 'destructive'
    }));
  });

  it('validates email format', async () => {
    setupForm();
    await fillForm('invalid-email', 'password123');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Invalid email',
      variant: 'destructive'
    }));
  });

  it('handles non-existent account and suggests sign up', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      error: { message: 'Invalid login credentials' }
    });

    setupForm();
    await fillForm('new@example.com', 'Password123!');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Account not found'
      }));
    });
  });

  it('handles successful sign in', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: '123' } },
      error: null
    });

    setupForm();
    await fillForm('existing@example.com', 'Password123!');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles password recovery click', async () => {
    setupForm();
    const recoveryButton = screen.getByText(/forgot password/i);
    
    fireEvent.click(recoveryButton);
    
    // Should show success message when email is provided
    await fillForm('user@example.com', '');
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Email required'
      }));
    });
  });

  it('switches to sign up form when button clicked', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      error: { message: 'Invalid login credentials' }
    });

    setupForm();
    await fillForm('new@example.com', 'Password123!');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const signUpButton = screen.getByRole('button', { name: /create an account/i });
      fireEvent.click(signUpButton);
      expect(mockOnSwitchToSignUp).toHaveBeenCalled();
    });
  });

  it('handles captcha verification failure', async () => {
    (useCaptchaVerification as any).mockReturnValue({
      verifyCaptcha: vi.fn().mockResolvedValue({ success: false })
    });

    setupForm();
    await fillForm('test@example.com', 'Password123!');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Verification Failed'
      }));
    });
  });

  it('handles unexpected errors during sign in', async () => {
    (supabase.auth.signInWithPassword as any).mockRejectedValue(new Error('Unexpected error'));

    setupForm();
    await fillForm('test@example.com', 'Password123!');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error signing in',
        description: 'An unexpected error occurred. Please try again.'
      }));
    });
  });
});
