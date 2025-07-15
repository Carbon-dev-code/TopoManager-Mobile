import { useEffect } from 'react'; // Ajoutez cette importation
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonMenu,
  IonMenuToggle,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
  setupIonicReact,
  IonIcon
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { documentOutline, informationOutline, mapOutline } from 'ionicons/icons';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Accueil from './pages/accueil/Accueil';
import Login from './pages/login/Login';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';
import { StatusBar, Style } from '@capacitor/status-bar';

setupIonicReact();

const App: React.FC = () => {
  // Ajoutez cet effet pour configurer la barre de statut
  useEffect(() => {
    const configureStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#000000' });
      } catch (error) {
        console.warn('StatusBar not available in browser', error);
      }
    };

    configureStatusBar();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main-content">
          
          {/* === MENU LATERAL === */}
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
                    <IonIcon icon={informationOutline} slot="start" />
                    <IonLabel>Syncronisation</IonLabel>
                  </IonItem>
                </IonMenuToggle>
              </IonList>
            </IonContent>
          </IonMenu>

          {/* === CONTENU PRINCIPAL === */}
          <IonPage id="main-content">
            {/* Ajoutez cette div wrapper avec safe-area */}
            <div style={{
              paddingTop: 'var(--ion-safe-area-top, 0)',
              paddingBottom: 'var(--ion-safe-area-bottom, 0)',
              height: '100%'
            }}>
              <IonRouterOutlet>
                <Route exact path="/accueil">
                  <Accueil />
                </Route>
                <Route exact path="/login">
                  <Login />
                </Route>
                <Route exact path="/tab1">
                  <Tab1 />
                </Route>
                <Route exact path="/tab2">
                  <Tab2 />
                </Route>
                <Route path="/tab3">
                  <Tab3 />
                </Route>
                <Route exact path="/">
                  <Redirect to="/accueil" />
                </Route>
              </IonRouterOutlet>
            </div>
          </IonPage>

        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;