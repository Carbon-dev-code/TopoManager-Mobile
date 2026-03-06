// App.tsx
import { IonApp, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import MainRouter from "./MainRouter";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "./theme/variables.css";
import { DbProvider } from "./model/base/DbContextType";

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    const configureStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#ffffff" });
      } catch(e) {
        console.error("Error", e);
        
      }
    };

    configureStatusBar();
  }, []);

  return (
    <IonApp>
      <DbProvider>
        <IonReactRouter>
          <div style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <MainRouter />
          </div>
        </IonReactRouter>
      </DbProvider>
    </IonApp>
  );
};

export default App;
