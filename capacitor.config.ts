import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.univ.quantumchem',
  appName: 'QuantumChem',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  // Allow both portrait and landscape orientation
  // Simulations work best in landscape, but allow user rotation
  ios: {
    orientation: ['portrait', 'landscape']
  },
  android: {
    orientation: 'unspecified' // Allow system to choose based on user settings
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      showSpinner: true,
      spinnerColor: '#340E51'
    },
    StatusBar: {
      style: 'light'
    }
  }
};

export default config;
