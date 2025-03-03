
import { FileText, Settings, Upload } from 'lucide-react';
import { Step } from '@/components/steps/StepsProgressBar';

export const conversionSteps: Step[] = [
  {
    id: 1,
    title: 'Upload File',
    description: 'Select or drag & drop your PDF or EPUB file',
    icon: Upload
  },
  {
    id: 2,
    title: 'Configure Settings',
    description: 'Choose voice and customize options',
    icon: Settings
  },
  {
    id: 3,
    title: 'Convert & Download',
    description: 'Process your file and get the audio',
    icon: FileText
  }
];
