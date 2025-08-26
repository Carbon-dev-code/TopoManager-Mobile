import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'TopoManager',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: "http"
  },
  plugins: {
    Geolocation: {
      permissions: ['android.permission.ACCESS_FINE_LOCATION']
    }
  }
};

export default config;