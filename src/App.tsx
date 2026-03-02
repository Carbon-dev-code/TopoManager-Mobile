// App.tsx
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect, useState } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import MainRouter from './MainRouter';

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
import { DbProvider } from './model/base/DbContextType';

setupIonicReact();

const App: React.FC = () => {
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  useEffect(() => {
    const configureStatusBar = async () => {
      try {
        // On chevauche la webview pour éviter l'espace moche
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });

        // Récupère la hauteur exacte pour padding dynamique
        const info = await StatusBar.getInfo();
        setStatusBarHeight(info.statusBarHeight || 0);
      } catch (error) {
        // StatusBar non disponible dans le browser
      }
    };

    configureStatusBar();

    // Optionnel: si rotation ou resize
    const handleResize = async () => {
      const info = await StatusBar.getInfo();
      setStatusBarHeight(info.statusBarHeight || 0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <IonApp>
      <DbProvider>
        <IonReactRouter>
          {/* On wrap le MainRouter pour ajouter un paddingTop dynamique */}
          <div style={{ paddingTop: `${statusBarHeight}px` }}>
            <MainRouter />
          </div>
        </IonReactRouter>
      </DbProvider>
    </IonApp>
  );
};

export default App;