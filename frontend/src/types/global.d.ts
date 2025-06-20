interface Window {
  plausible?: (...args: any[]) => void;
  ENV_CONFIG: {
    NEXT_PUBLIC_CASDOOR_SERVER_URL: string;
    NEXT_PUBLIC_CASDOOR_CLIENT_ID: string;
    NEXT_PUBLIC_CASDOOR_APP_NAME: string;
    NEXT_PUBLIC_CASDOOR_ORG_NAME: string;
    NEXT_PUBLIC_CASDOOR_REDIRECT_URI: string;
    NEXT_PUBLIC_CONTACT_FORM_ACTION: string;
    [key: string]: string;
  };
  turnstile?: {
    render: (container: HTMLElement, options: any) => string;
    reset: (widgetId: string) => void;
    remove: (widgetId: string) => void;
  };
  onloadTurnstileCallback?: () => void;
} 

// Declare global environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_CASDOOR_SERVER_URL: string;
    NEXT_PUBLIC_CASDOOR_CLIENT_ID: string;
    NEXT_PUBLIC_CASDOOR_ORG_NAME: string;
    NEXT_PUBLIC_CASDOOR_APP_NAME: string;
    NEXT_PUBLIC_CASDOOR_REDIRECT_URI: string;
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: string;
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_ENABLE: string;
  }
} 