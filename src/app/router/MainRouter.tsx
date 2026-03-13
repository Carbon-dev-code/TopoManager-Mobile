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
} from "@ionic/react";
import { useLocation, Redirect, Route } from "react-router-dom";
import {
  documentOutline,
  mapOutline,
  cloudUploadOutline,
  settings,
  logOutOutline,
  chevronForwardOutline,
  peopleOutline,
  terminalOutline,
  tabletPortraitSharp,
} from "ionicons/icons";

import ParcelleCollectionPage from "../../pages/parcelle/ParcelleCollectionPage";
import MapViewerPage from "../../pages/map/MapViewerPage";
import SyncManagerPage from "../../pages/sync/SyncManagerPage";
import SettingsPage from "../../pages/setting/SettingsPage";
import AdminSettingsPage from "../../pages/admin/AdminSettingsPage";
import DeviceStatusPage from "../../pages/device/DeviceStatusPage";
import Profil from "../../pages/profil/Profil";
import Accueil from "../../pages/accueil/Accueil";
import Login from "../../pages/login/Login";
import DemandeurManagementPage from "../../pages/demandeur/DemandeurManagementPage";
import { Preferences } from "@capacitor/preferences";
import { useEffect, useState } from "react";

import "./MainRouter.css";

const MainRouter: React.FC = () => {
  const location = useLocation();
  const hideMenu =
    location.pathname === "/accueil" || location.pathname === "/login";
  const [username, setUsername] = useState<string>("");
  const [idSession, setIdSession] = useState<number | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const { value } = await Preferences.get({ key: "id_session" });
      setIdSession(value ? parseInt(value, 10) : null);
    };
    loadSession();
  }, []);

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
      <IonMenu
        contentId="main-content"
        type="push"
        side="start"
        swipeGesture={true}
      >
        <IonContent className="color-smoke">
          <IonLabel>TopoManager</IonLabel>
          <IonList className="p-0">
            <div className="compact">
              <IonMenuToggle autoHide={false}>
                <IonItem
                  className="user-item"
                  lines="none"
                  routerLink="/profil"
                  routerDirection="none"
                >
                  <div className="avatar">{initial}</div>
                  <div className="user-info">
                    <IonLabel className="username">{username}</IonLabel>
                    <IonLabel className="status">Connecté</IonLabel>
                  </div>
                </IonItem>
              </IonMenuToggle>
            </div>

            <div className="compact">
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/tab7" routerDirection="none" lines="none">
                  <IonIcon icon={tabletPortraitSharp} slot="start" />
                  <IonLabel>Device</IonLabel>
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
                <IonItem routerLink="/tab2" routerDirection="none" lines="none">
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
                  <IonLabel>Synchronisation</IonLabel>
                  <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/tab4" routerDirection="none" lines="none">
                  <IonIcon icon={settings} slot="start" />
                  <IonLabel>Paramètrage</IonLabel>
                  <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonItem>
              </IonMenuToggle>
            </div>
            {idSession === 0 && (
              <div className="compact">
                <IonMenuToggle autoHide={false}>
                  <IonItem
                    routerLink="/tab6"
                    routerDirection="none"
                    lines="none"
                  >
                    <IonIcon icon={terminalOutline} slot="start" />
                    <IonLabel>Admin</IonLabel>
                    <IonIcon icon={chevronForwardOutline} slot="end" />
                  </IonItem>
                </IonMenuToggle>
              </div>
            )}
          </IonList>
          <div style={{ position: "absolute", bottom: 0, width: "100%" }}>
            <IonMenuToggle autoHide={false}>
              <IonItem
                button
                onClick={async () => {
                  await Preferences.remove({ key: "is_logged_in" });
                  await Preferences.remove({ key: "id_session" });
                  window.location.href = "/accueil";
                }}
              >
                <IonIcon icon={logOutOutline} slot="start" color="danger" />
                <IonLabel color={"danger"}>Déconnexion</IonLabel>
              </IonItem>
            </IonMenuToggle>
          </div>
        </IonContent>
      </IonMenu>

      <IonPage id="main-content">
        <div
          style={{
            paddingTop: "var(--ion-safe-area-top, 0)",
            paddingBottom: "var(--ion-safe-area-bottom, 0)",
            height: "100%",
          }}
        >
          <IonRouterOutlet>
            <Route exact path="/tab1" component={ParcelleCollectionPage} />
            <Route exact path="/tab2" component={MapViewerPage} />
            <Route exact path="/tab3" component={SyncManagerPage} />
            <Route exact path="/tab4" component={SettingsPage} />
            <Route exact path="/tab6" component={AdminSettingsPage} />
            <Route exact path="/tab7" component={DeviceStatusPage} />
            <Route
              exact
              path="/demandeur"
              component={DemandeurManagementPage}
            />
            <Route exact path="/profil" component={Profil} />
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

