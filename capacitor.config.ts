import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.empatixtech.fineclause',
  appName: 'FineClause',
  webDir: 'dist',

  // Production server — comment out to bundle web assets locally
  // server: {
  //   url: 'https://www.fineclause.com',
  //   cleartext: false,
  // },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#2563eb',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2563eb',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    // Deep link scheme for email confirmation redirects
    App: {
      iosScheme: 'fineclause',
      androidScheme: 'fineclause',
    },
  },

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
    webContentsDebuggingEnabled: false, // set true during development
  },
};

export default config;
