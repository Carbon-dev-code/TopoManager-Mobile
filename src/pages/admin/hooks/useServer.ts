import { Preferences } from "@capacitor/preferences";
import { useState } from "react";
import { ConfigService } from "../../../shared/lib/config/ConfigService";
import { clearDatabase } from "../../../shared/lib/db/DbSchema";

export const useServer = () => {
    const [deviceId, setDeviceId] = useState<string>("");
    const [serverAdresse, setServerAdresse] = useState<string>("");

    const getServerAdresse = async () => {
        const serverUrl = await ConfigService.getServerIpPort();
        setServerAdresse(serverUrl);
    }

    const getDeviceId = async () => {
        const { value } = await Preferences.get({ key: "device_id" });
        setDeviceId(value || "");
    }

    const saveDeviceId = async (id: string) => {
        if (!id) return;
        await Preferences.set({ key: "device_id", value: id });
    }

    const saveServerAdresse = async (adresse: string) => {
        ConfigService.saveServerUrl(adresse);
    }

    const clearAll = async () => {
        await Preferences.clear();
        await clearDatabase();
        setDeviceId("");
        setServerAdresse("");
        setTimeout(() => { window.location.href = "/accueil"; }, 100);
    };

    return { serverAdresse, setServerAdresse, getServerAdresse, saveServerAdresse, getDeviceId, deviceId, setDeviceId, saveDeviceId, clearAll };
};