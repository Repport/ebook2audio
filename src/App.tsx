
import { Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import Index from '@/pages/Index';
import TextToSpeechPage from '@/pages/TextToSpeech';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/text-to-speech" element={<TextToSpeechPage />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
