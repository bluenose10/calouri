
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a429045b163e42ec82f88c22bbdade27',
  appName: 'Calouri',
  webDir: 'dist',
  server: {
    url: 'https://a429045b-163e-42ec-82f8-8c22bbdade27.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
