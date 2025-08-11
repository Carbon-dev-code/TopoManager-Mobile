import { Preferences } from "@capacitor/preferences";

export class ConfigService {
  private static readonly SERVER_URL_KEY = "server_url";

  static async getServerBaseUrl(): Promise<string> {
    try {
      const result = await Preferences.get({ key: this.SERVER_URL_KEY });
      if (result.value) {
        return result.value;
      }
      throw new Error("URL du serveur non configurée");
    } catch (e) {
      console.error("Erreur de chargement de l'URL:", e);
      throw e;
    }
  }

  static async setServerBaseUrl(url: string): Promise<void> {
    // Validation basique de l'URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }

    await Preferences.set({
      key: this.SERVER_URL_KEY,
      value: url,
    });
  }

  static async getServerIp(): Promise<string> {
    try {
      const baseUrl = await this.getServerBaseUrl();
      // Utilisation de l'objet URL pour parser
      const urlObj = new URL(baseUrl);
      return urlObj.hostname; // Ex: "192.168.1.10" ou "mon-serveur.local"
    } catch (e) {
      console.error("Erreur extraction IP:", e);
      throw e;
    }
  }
}
