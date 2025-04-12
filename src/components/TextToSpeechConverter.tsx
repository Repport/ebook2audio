
import React, { useState } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import VoiceSelector from './VoiceSelector';

interface TextToSpeechConverterProps {
  initialText?: string;
  fileName?: string;
}

const TextToSpeechConverter: React.FC<TextToSpeechConverterProps> = ({
  initialText = '',
  fileName = '',
}) => {
  const [text, setText] = useState(initialText);
  const [selectedVoice, setSelectedVoice] = useState('');
  
  const {
    status,
    progress,
    audioData,
    error,
    elapsedTime,
    estimatedTimeRemaining,
    convertText,
    reset,
    downloadAudio
  } = useTextToSpeech();
  
  const handleConvert = async () => {
    if (!text.trim()) {
      return;
    }
    
    await convertText(text, selectedVoice, fileName);
  };
  
  // Format time in seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const renderConversionStatus = () => {
    switch (status) {
      case 'converting':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <Spinner size="lg" className="text-primary" />
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-center space-y-1">
              <p className="font-medium">Converting text to speech...</p>
              {elapsedTime > 0 && (
                <p className="text-muted-foreground">
                  Time elapsed: {formatTime(elapsedTime)}
                  {estimatedTimeRemaining !== null && (
                    <> • Estimated time remaining: {formatTime(estimatedTimeRemaining)}</>
                  )}
                </p>
              )}
              <p className="text-muted-foreground">{progress}% complete</p>
            </div>
          </div>
        );
        
      case 'completed':
        return (
          <div className="space-y-4">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium">Conversion Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Your audio file is ready to download
              </p>
            </div>
            
            {audioData && (
              <div className="space-y-4">
                <audio 
                  src={URL.createObjectURL(new Blob([audioData], { type: 'audio/mpeg' }))} 
                  controls 
                  className="w-full" 
                />
                
                <div className="flex justify-center gap-2">
                  <Button onClick={downloadAudio} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download MP3
                  </Button>
                  <Button variant="outline" onClick={reset} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Convert Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'error':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conversion Failed</AlertTitle>
            <AlertDescription>
              {error || 'An unexpected error occurred during conversion.'}
            </AlertDescription>
            <div className="mt-4">
              <Button variant="outline" onClick={reset} size="sm">
                Try Again
              </Button>
            </div>
          </Alert>
        );
        
      default:
        return null;
    }
  };
  
  const isConverting = status === 'converting';
  const showForm = status === 'idle';
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Text to Speech Converter</CardTitle>
        <CardDescription>
          Convert your text to natural-sounding speech
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {showForm ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="text">Text to convert</Label>
              <Textarea
                id="text"
                placeholder="Enter the text you want to convert to speech..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="resize-y min-h-[200px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="voice">Select a voice</Label>
              <VoiceSelector 
                selectedVoice={selectedVoice}
                onVoiceSelect={setSelectedVoice}
              />
            </div>
            
            <Button 
              onClick={handleConvert} 
              disabled={!text.trim() || !selectedVoice || isConverting}
              className="w-full"
            >
              {isConverting ? <Spinner className="mr-2" /> : null}
              Convert to Speech
            </Button>
          </>
        ) : (
          renderConversionStatus()
        )}
      </CardContent>
    </Card>
  );
};

export default TextToSpeechConverter;
