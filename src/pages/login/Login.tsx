import {
  IonContent,
  IonPage,
  IonAlert,
  IonButton,
  IonIcon,
  IonItem,
  IonInput,
  IonRouterLink,
} from "@ionic/react";
import { useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";

import "../../assets/dist/css/bootstrap.min.css";
import "./Login.css";

const USERNAME_ADMIN = import.meta.env.VITE_ADMIN_USER;
const PASSWORD_ADMIN = import.meta.env.VITE_ADMIN_PASSWORD;

const Login: React.FC = () => {
  const emailRef = useRef<HTMLIonInputElement>(null);
  const passwordRef = useRef<HTMLIonInputElement>(null);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = (emailRef.current?.value ?? "").toString().trim();
    const passwordValue = (passwordRef.current?.value ?? "").toString().trim();
    if (passwordValue === PASSWORD_ADMIN && emailValue === USERNAME_ADMIN) {
      const SESSION_DURATION = 30 * 60 * 1000; // 30 min
      const expirationTime = new Date().getTime() + SESSION_DURATION;
      await Preferences.set({ key: "is_logged_in", value: "true" });
      await Preferences.set({ key: "id_session", value: "0" });
      await Preferences.set({ key: "username", value: "Admin" });
      await Preferences.set({
        key: "session_expiration",
        value: expirationTime.toString(),
      });
      window.location.href = "/tab1";
    } else {
      setShowPasswordAlert(true);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-bg">
          <div className="login-wrapper">
            <form className="login-form" onSubmit={handleLogin}>

              {/* Logo + Titre */}
              <div className="all-login-title">
                <div className="login-logo">T</div>
                <h1 className="login-title">TopoManager</h1>
                <p className="login-small-title">Collecte Foncière</p>
              </div>

              <div className="input-pile">
                <p className="mb-0 custom-label-login">
                  Identifiant<span className="red">*</span>
                </p>
                <IonItem lines="none" className="login-input">
                  <IonInput
                    type="text"
                    placeholder="Utilisateur"
                    ref={emailRef}
                    required
                  />
                </IonItem>
              </div>

              <div className="input-pile">
                <p className="mb-0 custom-label-login">
                  Mot de passe<span className="red">*</span>
                </p>
                <IonItem lines="none" className="login-input">
                  <IonInput
                    type={showPassword ? "text" : "password"}
                    placeholder="xxxxxxx"
                    ref={passwordRef}
                    required
                  />
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                    size="small"
                    color="medium"
                  >
                    <IonIcon
                      slot="icon-only"
                      icon={showPassword ? eyeOffOutline : eyeOutline}
                    />
                  </IonButton>
                </IonItem>
              </div>

              <IonButton expand="block" className="login-button" type="submit">
                Se connecter
              </IonButton>

              <IonRouterLink routerLink="/accueil" className="link-custom">
                Retour à <span className="text-primary">l'accueil</span>
              </IonRouterLink>
            </form>
          </div>
        </div>

        <IonAlert
          isOpen={showPasswordAlert}
          onDidDismiss={() => setShowPasswordAlert(false)}
          message="Mot de passe ou identifiant incorrect. Veuillez contacter l'administrateur."
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
