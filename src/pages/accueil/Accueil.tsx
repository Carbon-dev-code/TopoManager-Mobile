import {
  IonContent,
  IonPage,
  IonRouterLink,
} from '@ionic/react';

import '../../assets/dist/css/bootstrap.min.css';
import './Accueil.css';

import logo2 from '../../assets/image/logo/logo2.png';
import logon1 from '../../assets/image/logo/logon1.png';
import logo3 from '../../assets/image/logo/logo3.png';

const Accueil: React.FC = () => {
  return (
    <IonPage>     
      <IonContent fullscreen>
        <div>
            <div className="d-flex justify-content-between align-items-center py-3 pt-3">
                <img src={logo2} alt="MDAT Logo" className="header-logo" />
                <div className="text-center">
                    <img src={logon1} alt="Logo Central" className="center-logo mb-2" /><br />
                </div>
                <img src={logo3} alt="Observatoire Logo" className="header-logo" />
            </div>
            <h3 className="nav-item text-center p-2">
                Dématérialisation des
                procédures et documents topographiques fonciers
            </h3>
        </div>
        <section className="hero">
            <h2>Bienvenue sur TopoManager</h2>
            <p>Gérez efficacement les documents topographiques fonciers avec un outils innovants.</p>
            <IonRouterLink className="btn_connexion" routerLink="/login">
                Accéder au Formulaire
            </IonRouterLink>
        </section>
        <section id="features" className="features">
                <h3 className="text-center mb-4">Nos principales fonctionnalités </h3>
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="feature-card">
                            <h4>Suivi en temps réel</h4>
                            <p>Consultez la situation de vos dossiers à tout moment.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="feature-card">
                            <h4>Archive Numérique</h4>
                            <p>Solution moderne et efficace pour gérer et conserver les documents topographiques fonciers.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="feature-card">
                            <h4>Repérage Numérique</h4>
                            <p>Exploration interactive des données PLOF sur une carte.</p>
                        </div>
                    </div>
                </div>
        </section>
        <footer className="footer">
            <div className="row">
                <div className="col-md-6">
                    <h5>Contactez-nous</h5>
                    <p>Adresse : Anosy, Antananarivo, Madagascar</p>
                    <p>Téléphone : +261 32 00 000 00</p>
                    <p>Email : <a href="mailto:contact@suivitopographique.com">contact@suivitopographique.com</a></p>
                </div>
                <div className="col-md-6 text-end">
                    <h5>Suivez-nous</h5>
                    <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">LinkedIn</a>
                </div>
            </div>
            <div className="separator"></div>
            <div className="text-center mt-3">
                <p>&copy; 2025 DST : Direction des Services Topographiques. Tous droits réservés.</p>
            </div>
        </footer>
        
      </IonContent>
    </IonPage>
  );
};

export default Accueil;
