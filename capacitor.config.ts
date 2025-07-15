import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'TopoManager',
  webDir: 'dist',
  server: {
    cleartext: true,  // ← important
    androidScheme: "http"
  }
};

export default config;
