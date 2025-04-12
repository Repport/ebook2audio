
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TextToSpeechConverter from '@/components/TextToSpeechConverter';

const TextToSpeechPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Text to Speech Conversion</CardTitle>
            <CardDescription>
              Convert your text to natural-sounding audio with our simple tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Enter your text, select a voice, and convert it to speech. You can then listen to or download the audio file.
            </p>
          </CardContent>
        </Card>
        
        <TextToSpeechConverter />
      </div>
    </div>
  );
};

export default TextToSpeechPage;
