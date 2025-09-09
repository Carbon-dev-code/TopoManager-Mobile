import React, { useEffect, useRef, useState } from "react";
import initSqlJs from "sql.js";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import "../assets/dist/css/bootstrap.min.css";
import "./Tab2.css";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonContent,
} from "@ionic/react";

proj4.defs(
  "EPSG:29702",
  "+proj=omerc +lat_0=-18.9 +lonc=44.1 +alpha=18.9 +gamma=18.9 +k=0.9995 +x_0=400000 +y_0=800000 +ellps=intl +pm=paris +towgs84=-198.383,-240.517,-107.909,0,0,0,0 +units=m +no_defs +type=crs"
);
register(proj4);

const Tab2: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const [db, setDb] = useState<unknown>(null);

  useEffect(() => {
    async function loadMBTiles() {
      console.log("⏳ Chargement de sql.js...");
      const SQL = await initSqlJs({
        locateFile: (file: any) => `https://sql.js.org/dist/${file}`,
      });

      console.log("📥 Chargement du fichier amb.mbtiles...");
      const response = await fetch("/mbtiles/amb.mbtiles");
      if (!response.ok) {
        console.error(
          "❌ Erreur chargement du fichier MBTiles:",
          response.statusText
        );
        return;
      }

      const buffer = await response.arrayBuffer();

      console.log("🗄️ Création de la base SQLite...");
      const db = new SQL.Database(new Uint8Array(buffer));
      setDb(db);

      const stmtTables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      console.log("📋 Tables dans la base :");
      while (stmtTables.step()) {
        console.log(" -", stmtTables.get()[0]);
      }
      stmtTables.free();

      const zoomsStmt = db.prepare(
        "SELECT DISTINCT zoom_level FROM tiles ORDER BY zoom_level"
      );
      console.log("🧭 Niveaux de zoom disponibles dans les tuiles :");
      while (zoomsStmt.step()) {
        console.log(" - Zoom:", zoomsStmt.get()[0]);
      }
      zoomsStmt.free();
    }

    loadMBTiles();
  }, []);

  useEffect(() => {
    if (!mapElement.current || !db || mapRef.current) return;

    console.log("📊 Lecture des métadonnées...");
    let bounds: number[] = [46.192, -25.145, 46.588, -24.964]; // fallback si metadata manquante

    try {
      const stmt = db.prepare(
        "SELECT value FROM metadata WHERE name = 'bounds'"
      );
      if (stmt.step()) {
        const value = stmt.getAsObject().value as string;
        const parts = value.split(",").map(parseFloat);
        if (parts.length === 4) {
          bounds = parts;
          console.log("✅ Bounds trouvés dans metadata :", bounds);
        }
      } else {
        console.warn("⚠️ Aucun bounds dans metadata");
      }
      stmt.free();
    } catch (err) {
      console.error("⚠️ Erreur lecture bounds:", err);
    }

    console.log("🧱 Création de la source MBTiles...");
    const mbTilesSource = new XYZ({
      tileSize: 256,
      minZoom: 0,
      maxZoom: 18,

      // Important : fake URL pour déclencher le chargement manuel
      tileUrlFunction: (tileCoord) => {
        return `mbtiles://${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}`;
      },

      tileLoadFunction: (imageTile, src) => {
        const tileCoord = imageTile.getTileCoord();
        const z = tileCoord[0];
        const x = tileCoord[1];
        const y_ol = tileCoord[2];

        // Inversion Y pour compatibilité MBTiles
        const y = (1 << z) - 1 - y_ol;

        console.log(`🔍 Demande tile Z:${z} X:${x} Y:${y}`);

        const stmt = db.prepare(`
          SELECT tile_data FROM tiles 
          WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?
        `);
        stmt.bind([z, x, y]);

        if (stmt.step()) {
          const row = stmt.getAsObject();
          const blob = new Blob([row.tile_data], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          const image = imageTile.getImage();
          (image as HTMLImageElement).src = url;
          console.log(`✅ Tile chargée Z:${z} X:${x} Y:${y}`);
        } else {
          const image = imageTile.getImage();
          (image as HTMLImageElement).src =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/5+hHgAHggJ/oK/mnQAAAABJRU5ErkJggg==";
          console.warn(`❌ Tile manquante Z:${z} X:${x} Y:${y}`);
        }

        stmt.free();
      },
    });

    console.log("🗺️ Création de la carte avec OSM + MBTiles...");
    const map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new TileLayer({
          source: mbTilesSource,
        }),
      ],
      view: new View({
        center: fromLonLat([
          (bounds[0] + bounds[2]) / 2,
          (bounds[1] + bounds[3]) / 2,
        ]),
        zoom: 11, 
      }),
    });

    mapRef.current = map;
    console.log("✅ Carte initialisée avec OSM + MBTiles");
  }, [db]);

  return (
    <IonPage>
      <IonHeader className="custom-header">
        <IonToolbar className="custom-toolBar">
          <IonButtons slot="start" className="glass-btn">
            <IonMenuButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div ref={mapElement} className="map-container"></div>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
