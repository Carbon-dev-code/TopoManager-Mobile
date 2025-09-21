// MainRouter.tsx
import {
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
} from '@ionic/react';
import { useLocation, Redirect, Route } from 'react-router-dom';
import { documentOutline, mapOutline, cloudUploadOutline, settings, personOutline, logOutOutline, chevronForwardOutline, peopleOutline } from 'ionicons/icons';

import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Tab4 from './pages/Tab4';
import Accueil from './pages/accueil/Accueil';
import Login from './pages/login/Login';
import Demandeur from './pages/Tab5';
import { Preferences } from '@capacitor/preferences';
import "./MainRouter.css";
import { useEffect, useState } from 'react';

const MainRouter: React.FC = () => {
  const location = useLocation();
  const hideMenu = location.pathname === '/accueil' || location.pathname === '/login';

  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const loadUsername = async () => {
      const result = await Preferences.get({ key: "username" });
      if (result.value) setUsername(result.value);
    };
    loadUsername();
  }, []);

  const initial = username ? username.charAt(0).toUpperCase() : "?";

  if (hideMenu) {
    return (
      <IonRouterOutlet>
        <Route exact path="/accueil" component={Accueil} />
        <Route exact path="/login" component={Login} />
        <Route exact path="/">
          <Redirect to="/accueil" />
        </Route>
      </IonRouterOutlet>
    );
  }

  return (
    <IonSplitPane contentId="main-content" when={false}>
      <IonMenu contentId="main-content" type="push" side="start" swipeGesture={true}>
        <IonContent className='color-smoke'>
          <IonLabel>Menu</IonLabel>
          <IonList className='p-0'>
            <div className="compact">
              <IonMenuToggle autoHide={false}>
                <IonItem className="user-item">
                  <div className="avatar">{initial}</div>
                  <div className="user-info">
                    <IonLabel className="username">{username}</IonLabel>
                    <IonLabel className="status">Connecté</IonLabel>
                  </div>
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle autoHide={false}>
                <IonItem lines='none'>
                  <IonIcon icon={personOutline} slot="start" />
                  <IonLabel>Profil</IonLabel>
                  <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonItem>
              </IonMenuToggle>
            </div>
            <div className="compact">
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/tab1" routerDirection="none">
                  <IonIcon icon={documentOutline} slot="start" />
                  <IonLabel>Collecte de données</IonLabel>
                  <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/demandeur" routerDirection="none">
                  <IonIcon icon={peopleOutline} slot="start" />
                  <IonLabel>Demandeur</IonLabel>
                  <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/tab2" routerDirection="none" lines='none'>
                  <IonIcon icon={mapOutline} slot="start" />
                  <IonLabel>Carte</IonLabel>
                  <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonItem>
              </IonMenuToggle>
            </div>
            <div className="compact">
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/tab3" routerDirection="none">
                  <IonIcon icon={cloudUploadOutline} slot="start" />
                  <IonLabel>Upload</IonLabel>
                  <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/tab4" routerDirection="none" lines='none'>
                  <IonIcon icon={settings} slot="start" />
                  <IonLabel>Paramètrage</IonLabel>
                  <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonItem>
              </IonMenuToggle>
            </div>
          </IonList>
          {/* Déconnexion en bas */}
          <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <IonMenuToggle autoHide={false}>
              <IonItem button onClick={async () => {
                await Preferences.remove({ key: "is_logged_in" });
                await Preferences.remove({ key: "id_session" });
                window.location.href = "/accueil";
              }}>
                <IonIcon icon={logOutOutline} slot="start" color='danger' />
                <IonLabel color={'danger'}>Déconnexion</IonLabel>
              </IonItem>
            </IonMenuToggle>
          </div>
        </IonContent>
      </IonMenu>

      <IonPage id="main-content">
        <div
          style={{
            paddingTop: 'var(--ion-safe-area-top, 0)',
            paddingBottom: 'var(--ion-safe-area-bottom, 0)',
            height: '100%',
          }}
        >
          <IonRouterOutlet>
            <Route exact path="/tab1" component={Tab1} />
            <Route exact path="/tab2" component={Tab2} />
            <Route exact path="/tab3" component={Tab3} />
            <Route exact path="/tab4" component={Tab4} />
            <Route exact path="/demandeur" component={Demandeur} />
            <Route exact path="/">
              <Redirect to="/accueil" />
            </Route>
          </IonRouterOutlet>
        </div>
      </IonPage>
    </IonSplitPane>
  );
};

export default MainRouter;
