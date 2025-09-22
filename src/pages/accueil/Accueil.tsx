import { IonContent, IonPage, IonRouterLink } from "@ionic/react";

import "../../assets/dist/css/bootstrap.min.css";
import "./Accueil.css";

import logo2 from "../../assets/image/logo/logo2.png";
import logon1 from "../../assets/image/logo/logon1.png";
import logo3 from "../../assets/image/logo/logo3.png";

const Accueil: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="app-container">
          {/* Header */}
          <header className="header">
            <img src={logo2} alt="MDAT Logo" className="header-logo" />
            <img src={logon1} alt="Republic de Madagascar" className="header-logo center-logo" />
            <img src={logo3} alt="DST Logo" className="header-logo" />
          </header>

          {/* Main Content */}
          <main className="main-content">
            <section className="hero">
              <h2>Bienvenue sur TopoManager Mobile</h2>
              <p>
                Gérez efficacement les collectes des données topographiques fonciers avec un
                outil innovant.
              </p>
              <IonRouterLink className="btn_connexion" routerLink="/login">
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

          {/* Footer */}
          <footer className="footer">
            <p>&copy; 2025 DST : Direction des Services Topographiques. Tous droits réservés.</p>
          </footer>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Accueil;
