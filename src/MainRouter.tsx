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
import { documentOutline, mapOutline, cloudUploadOutline, sync} from 'ionicons/icons';

import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Tab4 from './pages/Tab4';
import Accueil from './pages/accueil/Accueil';
import Login from './pages/login/Login';

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
      <IonMenu contentId="main-content" type="overlay">
        <IonHeader>
          <IonToolbar>
            <IonTitle>TopoManager</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonList>
            <IonMenuToggle autoHide={false}>
              <IonItem routerLink="/tab1" routerDirection="none">
                <IonIcon icon={documentOutline} slot="start" />
                <IonLabel>Formulaire</IonLabel>
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
                <IonIcon icon={sync} slot="start" />
                <IonLabel>Syncronisation</IonLabel>
              </IonItem>
            </IonMenuToggle>
          </IonList>
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
