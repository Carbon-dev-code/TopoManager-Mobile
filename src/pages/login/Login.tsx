import {
  IonContent,
  IonPage,
  IonAlert,
  IonButton,
  IonIcon,
  IonItem,
  IonInput,
  IonLabel,
  IonRouterLink,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import Accueil from '../accueil/Accueil';

import "../../assets/dist/css/bootstrap.min.css";
import "./Login.css";
import logoTopoManager from "../../assets/image/BackGround/topomanager.png";

const PASSWORD = "topo123";
const USERNAME = "admin";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await Preferences.get({ key: "is_logged_in" });
      const savedEmail = await Preferences.get({ key: "saved_email" });

      if (session.value === "true") {
        window.location.href = "/tab1";
      }

      if (savedEmail.value) {
        setEmail(savedEmail.value);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password === PASSWORD && email === USERNAME) {
      // Sauvegarde session
      await Preferences.set({ key: "is_logged_in", value: "true" });

      window.location.href = "/tab1";
    } else {
      setShowPasswordAlert(true);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-background">
        <span className="circle"></span>
        <div className="login-wrapper">
          <form className="login-form" onSubmit={handleLogin}>
            {/* Titre */}
            <div className="text-center mb-4">
              <img
                src={logoTopoManager}
                alt="Logo TopoManager"
                className="img-topomanager"
              />
            </div>
            <h1 className="login-title">Mobile</h1>

            {/* Email */}
            <IonItem lines="none" className="login-input">
              <IonInput
                type="text"
                placeholder="Identifiant"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
                required
              />
            </IonItem>

            {/* Mot de passe */}
            <IonItem lines="none" className="login-input">
              <IonInput
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="Mot de passe"
                onIonChange={(e) => setPassword(e.detail.value!)}
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

            {/* Bouton */}
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