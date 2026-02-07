declare global {
  function tt(key: string, options?: Record<string, unknown>): string;
  interface Window {
    Echo: any;
    Pusher: any;
  }
}


// Vite import.meta.glob type definitions
// Extend ImportMeta globally to support Vite's glob feature
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  glob: (
    pattern: string,
    options?: {
      eager?: boolean;
      import?: string;
      query?: string | Record<string, string | number | boolean>;
      as?: string;
    }
  ) => Record<string, () => Promise<{ default: React.ComponentType<unknown> }>>;
  env?: {
    DEV?: boolean;
    MODE?: string;
    VITE_APP_NAME?: string;
    [key: string]: string | boolean | undefined;
  };
}

export {};

