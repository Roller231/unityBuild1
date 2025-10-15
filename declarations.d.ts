declare module "*.png" {
    const value: any;
    export default value;
  }
  declare module "*.jpg" {
    const value: any;
    export default value;
  }
  declare module "*.jpeg" {
    const value: any;
    export default value;
  }
  declare module "*.svg" {
    const value: any;
    export default value;
  }
  // declarations.d.ts
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initDataUnsafe: {
    user?: TelegramUser;
  };
  expand: () => void;
  close: () => void;
}

interface Window {
  Telegram: {
    WebApp: TelegramWebApp;
  };
}
