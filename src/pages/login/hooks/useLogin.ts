import { useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { sessionDuration } from "../utils/time";

const USERNAME_ADMIN = import.meta.env.VITE_ADMIN_USER;
const PASSWORD_ADMIN = import.meta.env.VITE_ADMIN_PASSWORD;

// hooks/useLogin.ts
export const useLogin = () => {
    const [showPasswordAlert, setShowPasswordAlert] = useState(false);
    const [loading, setLoading] = useState(false);

    const login = async (email: string, password: string,) => {
        if (email === USERNAME_ADMIN && password === PASSWORD_ADMIN) {
            await Preferences.set({ key: "is_logged_in", value: "true" });
            await Preferences.set({ key: "id_session", value: "0" });
            await Preferences.set({ key: "username", value: "Admin" });
            await Preferences.set({ key: "session_expiration", value: sessionDuration() });
            window.location.href = "/tab1";
        } else if (email === "" || password === "") {
            // TODO: Afficher un message d'erreur
            // Pour les autre utilisatier (Agent)
        } else {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                setShowPasswordAlert(true);
            }, 3000);
        }
    };

    return { login, loading, showPasswordAlert };
};