
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const handleValueChange = (value: string) => {
    // Type check to ensure it's a valid language
    if (value === 'en' || value === 'es' || value === 'fr' || value === 'de') {
      setLanguage(value);
    }
  };

  return (
    <Select defaultValue={language} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[130px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="fr">Français</SelectItem>
        <SelectItem value="de">Deutsch</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
