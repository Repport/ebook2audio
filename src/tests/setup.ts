
// Configuración global de tests
import { beforeAll, afterEach, vi } from 'vitest';

// Mock de Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ 
        eq: vi.fn(() => ({ 
          maybeSingle: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => ({ error: null }))
    }))
  }
}));

// Mock de navegador APIs
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});

// Mock de performance
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now()
  }
});

beforeAll(() => {
  // Configuración global antes de todos los tests
});

afterEach(() => {
  // Limpieza después de cada test
  vi.clearAllMocks();
});
