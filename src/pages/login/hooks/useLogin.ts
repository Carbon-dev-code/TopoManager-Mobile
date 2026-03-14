import { useState } from "react";
import { Preferences } from "@capacitor/preferences";

const USERNAME_ADMIN = import.meta.env.VITE_ADMIN_USER;
const PASSWORD_ADMIN = import.meta.env.VITE_ADMIN_PASSWORD;

// hooks/useLogin.ts
export const useLogin = () => {
    const [showPasswordAlert, setShowPasswordAlert] = useState(false);
    const [loading, setLoading] = useState(false);

    const login = async (email: string, password: string,) => {
        setLoading(true);
        try {
            if (email === USERNAME_ADMIN && password === PASSWORD_ADMIN) {
                const SESSION_DURATION = 30 * 60 * 1000;
                const expirationTime = new Date().getTime() + SESSION_DURATION;
                await Preferences.set({ key: "is_logged_in", value: "true" });
                await Preferences.set({ key: "id_session", value: "0" });
                await Preferences.set({ key: "username", value: "Admin" });
                await Preferences.set({ key: "session_expiration", value: expirationTime.toString()});
                window.location.href = "/tab1";
            } else {
                setShowPasswordAlert(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, showPasswordAlert, setShowPasswordAlert };
};