import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.univ.quantumchem',
  appName: 'QuantumChem',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  // Screen orientation is not a Capacitor config option; it is set in the native
  // projects (ios/App/App/Info.plist, android/app/src/main/AndroidManifest.xml)
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
