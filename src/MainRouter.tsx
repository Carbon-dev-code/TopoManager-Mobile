// MainRouter.tsx
import {
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
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
import { documentOutline, mapOutline, cloudUploadOutline, settings, personOutline, logOutOutline } from 'ionicons/icons';

import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Tab4 from './pages/Tab4';
import Accueil from './pages/accueil/Accueil';
import Login from './pages/login/Login';
import Demandeur from './pages/Tab5';
import { Preferences } from '@capacitor/preferences';
import "./MainRouter.css";

const MainRouter: React.FC = () => {
  const location = useLocation();
  const hideMenu = location.pathname === '/accueil' || location.pathname === '/login';

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
      <IonMenu contentId="main-content" type="overlay" side="start" swipeGesture={true}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle className='text-start'>TopoManager Mobile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonMenuToggle autoHide={false}>
              <IonItem routerLink="/tab1" routerDirection="none">
                <IonIcon icon={documentOutline} slot="start" />
                <IonLabel>Collecte de données</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonMenuToggle autoHide={false}>
              <IonItem routerLink="/demandeur" routerDirection="none">
                <IonIcon icon={personOutline} slot="start" />
                <IonLabel>Demandeur</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonMenuToggle autoHide={false}>
              <IonItem routerLink="/tab2" routerDirection="none">
                <IonIcon icon={mapOutline} slot="start" />
                <IonLabel>Carte</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonMenuToggle autoHide={false}>
              <IonItem routerLink="/tab3" routerDirection="none">
                <IonIcon icon={cloudUploadOutline} slot="start" />
                <IonLabel>Upload</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonMenuToggle autoHide={false}>
              <IonItem routerLink="/tab4" routerDirection="none">
                <IonIcon icon={settings} slot="start" />
                <IonLabel>Paramètrage</IonLabel>
              </IonItem>
            </IonMenuToggle>
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
