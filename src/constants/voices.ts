
export const VOICES = {
  english: [
    { id: "en-US-Standard-C", label: "English - Female (Standard)" },
    { id: "en-US-Standard-B", label: "English - Male (Standard)" }
  ],
  spanish: [
    { id: "es-US-Standard-A", label: "Spanish - Female (Standard)" },
    { id: "es-US-Standard-B", label: "Spanish - Male (Standard)" }
  ],
  french: [
    { id: "fr-FR-Standard-A", label: "French - Female (Standard)" },
    { id: "fr-FR-Standard-B", label: "French - Male (Standard)" }
  ],
  german: [
    { id: "de-DE-Standard-A", label: "German - Female (Standard)" },
    { id: "de-DE-Standard-B", label: "German - Male (Standard)" }
  ]
} as const;

export const DEFAULT_PREVIEW_TEXTS = {
  english: "Hello! This is a preview of my voice.",
  spanish: "¡Hola! Este es un adelanto de mi voz.",
  french: "Bonjour! Ceci est un aperçu de ma voix.",
  german: "Hallo! Dies ist eine Vorschau meiner Stimme.",
} as const;
