import { IonContent, IonPage, IonRouterLink } from "@ionic/react";
import { useCallback } from "react";
import { Preferences } from "@capacitor/preferences";
import { useHistory } from "react-router-dom";

import "../../assets/dist/css/bootstrap/bootstrap.min.css";
import "./Accueil.css";

import logo2 from "../../assets/image/logo/logo2.png";
import logon1 from "../../assets/image/logo/logon1.png";
import logo3 from "../../assets/image/logo/logo3.png";

const Accueil: React.FC = () => {
  const history = useHistory();

  const checkSession = useCallback(async () => {
    const session = await Preferences.get({ key: "is_logged_in" });
    const expiration = await Preferences.get({ key: "session_expiration" });
    const now = new Date().getTime();
    if (session.value === "true" && expiration.value && parseInt(expiration.value) > now) {
      history.replace("/tab1");
    } else { // session expirée ou non connectée
      await Preferences.remove({ key: "is_logged_in" });
      await Preferences.remove({ key: "username" });
      await Preferences.remove({ key: "id_session" });
      await Preferences.remove({ key: "session_expiration" });
      history.replace("/login");
    }
  }, [history]);

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="app-container">
          <header className="header">
            <img src={logo2} alt="MDAT Logo" className="header-logo" />
            <img src={logon1} alt="Republic de Madagascar" className="header-logo center-logo" />
            <img src={logo3} alt="DST Logo" className="header-logo" />
          </header>

          <main className="main-content">
            <section className="hero">
              <h2>Bienvenue sur TopoManager Mobile</h2>
              <p>
                Gérez efficacement les collectes des données topographiques fonciers avec un
                outil innovant.
              </p>
              <IonRouterLink className="btn_connexion" onClick={checkSession}>
                Se connecter
              </IonRouterLink>
            </section>

            <section id="features" className="features">
              <h3 className="text-center m-0 mb-4">Nos principales fonctionnalités</h3>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="feature-card">
                    <h4>Collecte des données</h4>
                    <p>Collecter les données topographiques en un temps record.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="feature-card">
                    <h4>Repérage Numérique</h4>
                    <p>Exploration interactive des données PLOF sur une carte.</p>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <footer className="footer">
            <p>&copy; 2025 DST : Direction des Services Topographiques. Tous droits réservés.</p>
          </footer>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Accueil;