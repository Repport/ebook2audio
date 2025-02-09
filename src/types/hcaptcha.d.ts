
interface Window {
  hcaptcha: {
    render: (container: string, parameters: object) => number;
    execute: (widgetId: number) => Promise<string>;
    reset: (widgetId?: number) => void;
    remove: (widgetId: number) => void;
  };
}
