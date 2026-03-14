import { Preferences } from "@capacitor/preferences";

export class ConfigService {
  private static readonly SERVER_URL_KEY = import.meta.env.VITE_SERVER_URL_KEY;

  static async getServerBaseUrl(): Promise<string> {
    try {
      const result = await Preferences.get({ key: this.SERVER_URL_KEY });
      if (result.value) {
        return result.value;
      } else {
        return import.meta.env.VITE_DEFAULT_IP_PORT;
      }
    } catch (e) {
      console.error("Erreur de chargement de l'URL:", e);
      throw e;
    }
  }

  static async getServerIp(): Promise<string> {
    try {
      const baseUrl = await this.getServerBaseUrl();
      const urlObj = new URL(baseUrl);
      return urlObj.hostname;
    } catch (e) {
      console.error("Erreur extraction IP:", e);
      throw e;
    }
  }

  static async checkServerAvailability(timeout: number = 500): Promise<boolean> {
    try {
      const serverUrl = await this.getServerBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${serverUrl}/ping`, {
          signal: controller.signal,
          method: 'GET'
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("Ping serveur échoué:", err);
        return false;
      }
    } catch (e) {
      console.error("Erreur vérification serveur:", e);
      return false;
    }
  }

  static async verifyServerConnection(timeout: number = 500): Promise<void> {
    const isAvailable = await this.checkServerAvailability(timeout);
    if (!isAvailable) {
      throw new Error("Serveur inaccessible");
    }
  }

  static async getServerIpPort(): Promise<string> {
    try {
      const baseUrl = await this.getServerBaseUrl();
      const urlObj = new URL(baseUrl);
      return `${urlObj.hostname}:${urlObj.port || (urlObj.protocol === "https:" ? "443" : "80")}`;
    } catch (e) {
      console.error("Erreur extraction IP:Port:", e);
      throw e;
    }
  }

  static async saveServerUrl(ipPort: string): Promise<string> {
    let cleaned = ipPort.trim().replace(/^https?:\/\//, "");

    if (!cleaned.includes(":")) {
      cleaned = `${cleaned}:${import.meta.env.VITE_PORT_SERVER}`;
    }

    if (!cleaned.match(/^[\w.-]+(:\d+)?$/)) {
      throw new Error("Format invalide. Utilisez IP:port (ex: 192.168.1.100:80)");
    }

    const fullUrl = `http://${cleaned}${import.meta.env.VITE_API_BASE_PATH}`;

    await Preferences.set({
      key: this.SERVER_URL_KEY,
      value: fullUrl,
    });

    return cleaned;
  }
}
