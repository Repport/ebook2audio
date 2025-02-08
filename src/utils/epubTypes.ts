
export interface SpineItem {
  href: string;
  id?: string;
  linear?: boolean;
  properties?: string[];
  index?: number;
}

export interface ExtendedSpine {
  items: SpineItem[];
}

export interface ProcessedChunk {
  text: string;
  newChapters: {
    title: string;
    startIndex: number;
  }[];
}
