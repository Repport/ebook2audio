
import React, { useState, useEffect } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import Header from '@/components/Header';
import FileProcessor from '@/components/FileProcessor';
import { Card } from '@/components/ui/card';
import { Check, FileText, Settings, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Chapter } from '@/utils/textExtraction';
import Footer from '@/components/Footer';

const steps = [
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

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');

  // Restaurar el estado al cargar la página
  useEffect(() => {
    const savedStep = sessionStorage.getItem('currentStep');
    const savedText = sessionStorage.getItem('extractedText');
    const savedChapters = sessionStorage.getItem('chapters');
    const savedLanguage = sessionStorage.getItem('detectedLanguage');
    const savedFileName = sessionStorage.getItem('fileName');
    const savedFileType = sessionStorage.getItem('fileType');
    const savedFileLastModified = sessionStorage.getItem('fileLastModified');
    const savedFileSize = sessionStorage.getItem('fileSize');

    if (savedStep && savedText && savedFileName) {
      setCurrentStep(parseInt(savedStep));
      setExtractedText(savedText);
      if (savedChapters) {
        setChapters(JSON.parse(savedChapters));
      }
      setDetectedLanguage(savedLanguage || 'english');

      // Reconstruir el objeto File
      if (savedFileType && savedFileLastModified && savedFileSize) {
        const file = new File(
          [new Blob([])], // Contenido vacío ya que tenemos el texto extraído
          savedFileName,
          {
            type: savedFileType,
            lastModified: parseInt(savedFileLastModified),
          }
        );
        setSelectedFile(file);
      }
    }
  }, []);

  // Guardar el estado cuando cambie
  useEffect(() => {
    if (currentStep > 1 && selectedFile) {
      sessionStorage.setItem('currentStep', currentStep.toString());
      sessionStorage.setItem('extractedText', extractedText);
      sessionStorage.setItem('chapters', JSON.stringify(chapters));
      sessionStorage.setItem('detectedLanguage', detectedLanguage);
      sessionStorage.setItem('fileName', selectedFile.name);
      sessionStorage.setItem('fileType', selectedFile.type);
      sessionStorage.setItem('fileLastModified', selectedFile.lastModified.toString());
      sessionStorage.setItem('fileSize', selectedFile.size.toString());
    } else {
      // Limpiar storage si volvemos al paso 1
      sessionStorage.removeItem('currentStep');
      sessionStorage.removeItem('extractedText');
      sessionStorage.removeItem('chapters');
      sessionStorage.removeItem('detectedLanguage');
      sessionStorage.removeItem('fileName');
      sessionStorage.removeItem('fileType');
      sessionStorage.removeItem('fileLastModified');
      sessionStorage.removeItem('fileSize');
    }
  }, [currentStep, selectedFile, extractedText, chapters, detectedLanguage]);

  const handleFileSelect = async (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => {
    if (!fileInfo) {
      setSelectedFile(null);
      setExtractedText('');
      setChapters([]);
      setDetectedLanguage('english');
      setCurrentStep(1);
      return;
    }

    setSelectedFile(fileInfo.file);
    setExtractedText(fileInfo.text);
    setChapters(fileInfo.chapters || []);
    setDetectedLanguage(fileInfo.language || 'english');
    setCurrentStep(2);
    console.log('Index - Setting detected language:', fileInfo.language);
  };

  const goToNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex-grow container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Header />

          <div className="mb-12">
            <div className="flex justify-center items-center space-x-4 md:space-x-8">
              {steps.map((step) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200",
                        currentStep === step.id
                          ? "border-primary bg-primary text-white dark:border-white dark:bg-white dark:text-gray-900"
                          : currentStep > step.id
                          ? "border-primary bg-primary/10 text-primary dark:border-white dark:bg-white/10 dark:text-white"
                          : "border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-400"
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5 m-auto" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium dark:text-white">{step.title}</p>
                      <p className="text-xs text-gray-500 hidden md:block dark:text-gray-400">{step.description}</p>
                    </div>
                  </div>
                  {step.id !== steps.length && (
                    <div 
                      className={cn(
                        "flex-1 h-0.5 transition-colors duration-200",
                        currentStep > step.id
                          ? "bg-primary dark:bg-white"
                          : "bg-gray-300 dark:bg-gray-600"
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Card className="p-6 shadow-lg">
            {currentStep === 1 && (
              <div className="animate-fade-up">
                <FileUploadZone onFileSelect={handleFileSelect} />
              </div>
            )}

            {currentStep >= 2 && selectedFile && (
              <div className="animate-fade-up">
                <FileProcessor
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  extractedText={extractedText}
                  chapters={chapters}
                  detectedLanguage={detectedLanguage}
                  onStepComplete={() => setCurrentStep(3)}
                  currentStep={currentStep}
                  onNextStep={goToNextStep}
                  onPreviousStep={goToPreviousStep}
                />
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
