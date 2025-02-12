
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
    setLanguage(value);
  };

  return (
    <Select defaultValue={language} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[130px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="english">English</SelectItem>
        <SelectItem value="spanish">Español</SelectItem>
        <SelectItem value="french">Français</SelectItem>
        <SelectItem value="german">Deutsch</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
