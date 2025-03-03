
export type ConversionStatusType = 'idle' | 'converting' | 'completed' | 'error' | 'processing';

export interface BaseConversionStatusProps {
  status: ConversionStatusType;
  translations: Record<string, string>;
}
