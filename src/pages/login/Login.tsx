import { IonContent, IonPage, IonAlert } from "@ionic/react";
import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";

import "../../assets/dist/css/bootstrap.min.css";
import "./Login.css";
import logoTopoManager from "../../assets/image/BackGround/topomanager.png";

const PASSWORD = "topo123";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await Preferences.get({ key: "is_logged_in" });
      const savedEmail = await Preferences.get({ key: "saved_email" });
      if (session.value === "true") {
        window.location.href = "/tab1";
      }

      if (savedEmail.value) {
        setEmail(savedEmail.value);
        setRememberMe(true);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password === PASSWORD) {
      // Sauvegarde session
      await Preferences.set({ key: "is_logged_in", value: "true" });

      if (rememberMe) {
        await Preferences.set({ key: "saved_email", value: email });
      } else {
        await Preferences.remove({ key: "saved_email" });
      }

      window.location.href = "/tab1";
    } else {
      setShowPasswordAlert(true);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-page">
        <div className="container-fluid d-flex flex-column min-vh-100 p-0">
          {/* Bloc Login design */}
          <div className="row justify-content-center mt-auto">
            <div className="block-login shadow-lg">
              <form className="p-5" onSubmit={handleLogin}>
                <div className="row justify-content-center pt-4">
                  <img
                    src={logoTopoManager}
                    alt="Logo TopoManager"
                    className="img-topomanager"
                  />
                </div>

                {/* Email */}
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control"
                    id="floatingEmail"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="floatingEmail">Adresse Email</label>
                </div>

                {/* Mot de passe */}
                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control"
                    id="floatingPassword"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="floatingPassword">Mot de passe</label>
                </div>

                {/* Checkbox */}
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="remember">
                    Se souvenir de moi
                  </label>
                </div>

                {/* Bouton Connexion */}
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg stylish-btn"
                  >
                    Connexion
                  </button>
                </div>

                <div className="text-center mt-3">
                  <small>
                    Pas encore de compte ? <a href="#">S’inscrire</a>
                  </small>
                </div>
              </form>
            </div>
          </div>
        </div>
        <IonAlert
          isOpen={showPasswordAlert}
          onDidDismiss={() => setShowPasswordAlert(false)}
          message="Mot de passe incorrect. Veuillez contacter l'administrateur."
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
