
export const VOICES = {
  english: [
    { id: "en-US-Standard-C", label: "English - Female" },
    { id: "en-US-Standard-B", label: "English - Male" }
  ],
  spanish: [
    { id: "es-US-Standard-A", label: "Spanish - Female" },
    { id: "es-US-Standard-B", label: "Spanish - Male" }
  ],
  french: [
    { id: "fr-FR-Standard-A", label: "French - Female" },
    { id: "fr-FR-Standard-B", label: "French - Male" }
  ],
  german: [
    { id: "de-DE-Standard-A", label: "German - Female" },
    { id: "de-DE-Standard-B", label: "German - Male" }
  ]
} as const;

export const DEFAULT_PREVIEW_TEXTS = {
  english: "Hello! This is a preview of my voice.",
  spanish: "¡Hola! Este es un adelanto de mi voz.",
  french: "Bonjour! Ceci est un aperçu de ma voix.",
  german: "Hallo! Dies ist eine Vorschau meiner Stimme.",
} as const;
