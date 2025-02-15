
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReadingSpeed, READING_SPEEDS } from "@/hooks/useReadingSpeed";

interface ReadingSpeedSelectorProps {
  value: ReadingSpeed;
  onChange: (value: ReadingSpeed) => void;
}

export const ReadingSpeedSelector = ({ value, onChange }: ReadingSpeedSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select reading speed" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Reading Speed</SelectLabel>
          {(Object.entries(READING_SPEEDS) as [ReadingSpeed, { label: string }][]).map(([speed, { label }]) => (
            <SelectItem key={speed} value={speed}>
              {label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
