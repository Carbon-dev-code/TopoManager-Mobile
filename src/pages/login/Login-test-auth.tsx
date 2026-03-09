import {IonContent,IonPage,IonAlert,IonButton,IonIcon,IonItem,IonInput,IonRouterLink,} from "@ionic/react";
import { useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import * as bcrypt from "bcryptjs";
import { initDatabase } from "../../model/base/Database";

import "../../assets/dist/css/bootstrap.min.css";
import "./Login.css";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USER;
const ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH;

const Login: React.FC = () => {
  const emailRef = useRef<HTMLIonInputElement>(null);
  const passwordRef = useRef<HTMLIonInputElement>(null);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveSession = async (userId: string,username: string,roles: string[],) => {
    const SESSION_DURATION = 30 * 60 * 1000; // 30 min
    const expirationTime = new Date().getTime() + SESSION_DURATION;
    await Preferences.set({ key: "is_logged_in", value: "true" });
    await Preferences.set({ key: "id_session", value: userId });
    await Preferences.set({ key: "username", value: username });
    await Preferences.set({ key: "roles", value: JSON.stringify(roles) });
    await Preferences.set({key: "session_expiration",value: expirationTime.toString(),});};

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const usernameValue = (emailRef.current?.value ?? "").toString().trim();
    const passwordValue = (passwordRef.current?.value ?? "").toString().trim();

    try {
      // ──────────────────────────────────────────
      // CAS 1 : Admin embarqué (.env)
      // ──────────────────────────────────────────
      if (usernameValue === ADMIN_USERNAME) {
        // Convertir $2y$ Laravel → $2b$ bcryptjs
        const compatibleHash = ADMIN_PASSWORD_HASH.replace(/^\$2y\$/, "$2b$");
        const valid = await bcrypt.compare(passwordValue, compatibleHash);

        if (valid) {
          await saveSession("0", "Admin", ["admin"]);
          window.location.href = "/tab1";
          return;
        } else {
          setAlertMessage("Mot de passe incorrect.");
          setShowPasswordAlert(true);
          return;
        }
      }

      // ──────────────────────────────────────────
      // CAS 2 : Utilisateur provisionné (RxDB)
      // ──────────────────────────────────────────
      const database = await initDatabase();
      const localUser = await database.users
        .findOne({ selector: { username: usernameValue, isActive: true } })
        .exec();

      if (!localUser) {
        setAlertMessage(
          "Utilisateur introuvable. Contactez l'administrateur pour synchroniser les comptes.",
        );
        setShowPasswordAlert(true);
        return;
      }

      // Vérifier expiration du provisioning (30 jours)
      const provisionedAt = new Date(localUser.provisionedAt).getTime();
      const diffDays = (Date.now() - provisionedAt) / (1000 * 3600 * 24);
      if (diffDays > 30) {
        setAlertMessage(
          "Session expirée. Une connexion en ligne est requise pour renouveler l'accès.",
        );
        setShowPasswordAlert(true);
        return;
      }

      // Comparer le hash Laravel stocké localement
      const compatibleHash = localUser.passwordHash.replace(/^\$2y\$/, "$2b$");
      const valid = await bcrypt.compare(passwordValue, compatibleHash);

      if (valid) {
        await saveSession(localUser.id, localUser.username, localUser.roles);
        window.location.href = "/tab1";
      } else {
        setAlertMessage("Mot de passe incorrect.");
        setShowPasswordAlert(true);
      }
    } catch (error) {
      setAlertMessage("Une erreur est survenue. Veuillez réessayer.");
      setShowPasswordAlert(true);
      console.log("Erreur de connexuion", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-bg">
          <div className="login-wrapper">
            <form className="login-form" onSubmit={handleLogin}>
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
                    placeholder="utilisateur"
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

              <IonButton
                expand="block"
                className="login-button"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
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
          message={alertMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
