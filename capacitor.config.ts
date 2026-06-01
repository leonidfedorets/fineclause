import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.empatixtech.fineclause',
  appName: 'FineClause',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#f8fafc',
    preferredContentMode: 'mobile',
    minVersion: '15.0',
  },
  android: {
    backgroundColor: '#f8fafc',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
