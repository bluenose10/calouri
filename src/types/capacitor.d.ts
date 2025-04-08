
interface Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    convertFileSrc?: (path: string) => string;
    registerPlugin?: (name: string, methods: any) => any;
  };
}
