import {
  IonContent,
  IonPage,
  IonRouterLink,
} from '@ionic/react';

import '../../assets/dist/css/bootstrap.min.css';
import './Login.css';
import logoTopoManager from '../../assets/image/BackGround/topomanager.png';

const Login: React.FC = () => {

  return (
        <IonPage>
            <IonContent fullscreen className="login-page">
                <div className="container-fluid d-flex flex-column min-vh-100 p-0">
                    {/* Bloc Login design */}
                    <div className="row justify-content-center mt-auto">
                        <div className="block-login shadow-lg">
                        <form className="p-5">
                            <div className="row justify-content-center pt-4">
                                <img src={logoTopoManager} alt="Logo TopoManager" className="img-topomanager" />
                            </div>

                            {/* Email */}
                            <div className="form-floating mb-3">
                                <input type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" />
                                <label htmlFor="floatingEmail">Adresse Email</label>
                            </div>

                            {/* Mot de passe */}
                            <div className="form-floating mb-3">
                                <input type="password" className="form-control" id="floatingPassword" placeholder="Password" />
                                <label htmlFor="floatingPassword">Mot de passe</label>
                            </div>

                            {/* Checkbox */}
                            <div className="form-check mb-3">
                                <input className="form-check-input" type="checkbox" id="remember" />
                                <label className="form-check-label" htmlFor="remember">
                                    Se souvenir de moi
                                </label>
                            </div>

                            {/* Bouton Connexion */}
                            <div className="d-grid gap-2">
                                <IonRouterLink routerLink="/tab1" className="btn btn-primary btn-lg stylish-btn">
                                    Connexion
                                </IonRouterLink>
                            </div>

                            <div className="text-center my-3">
                                <span className="text-muted">Ou se connecter avec</span>
                            </div>

                            <div className="text-center mt-3">
                                <small>Pas encore de compte ? <a href="#">S’inscrire</a></small>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
  );
};

export default Login;
