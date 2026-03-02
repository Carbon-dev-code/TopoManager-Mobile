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
import { useEffect, useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";

import "../../assets/dist/css/bootstrap.min.css";
import "./Login.css";
import logoTopoManager from "../../assets/image/BackGround/topomanager.png";

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
      await Preferences.set({ key: "session_expiration", value: expirationTime.toString() });
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
              <div className="text-center mb-4">
                <img
                  src={logoTopoManager}
                  alt="Logo TopoManager"
                  className="img-topomanager"
                />
              </div>
              <h1 className="login-title">Mobile</h1>

              <IonItem lines="none" className="login-input">
                <IonInput
                  type="text"
                  placeholder="Identifiant"
                  ref={emailRef}
                  required
                />
              </IonItem>

              <IonItem lines="none" className="login-input">
                <IonInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
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

              <IonButton expand="block" className="login-button" type="submit">
                Connexion
              </IonButton>
              <IonRouterLink
                routerLink="/accueil"
                className="link-custom"
              >
                Retour à la page <span className="text-primary">d'accueil</span>
              </IonRouterLink>
            </form>
          </div>
        </div>
        {/* Alert mot de passe */}
        <IonAlert
          isOpen={showPasswordAlert}
          onDidDismiss={() => setShowPasswordAlert(false)}
          className="text-center"
          message="Mot de passe ou idetifiant incorrect. Veuillez contacter l'administrateur."
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;