
export { Logger, logger } from './Logger';
export * from './types';
export * from './transports/ConsoleTransport';
export * from './transports/SupabaseTransport';
export * from './formatters/DefaultFormatter';

// Hook para usar el logger en componentes React
import { logger } from './Logger';
export const useLogger = () => logger;
