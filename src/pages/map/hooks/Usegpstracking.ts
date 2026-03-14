import { useState, useRef, useCallback } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import OLMap from "ol/Map";
import { fromLonLat } from "ol/proj";

interface UseGpsTrackingOptions {
  mapRef: React.MutableRefObject<OLMap | null>;
  onError?: (message: string) => void;
}

interface UseGpsTrackingReturn {
  tracking: boolean;
  gpsAccuracy: number | null;
  gpsStatus: number; // 0=off 1=searching 2=ok 3=error
  toggleTracking: () => Promise<void>;
}

export function useGpsTracking({
  mapRef,
  onError,
}: UseGpsTrackingOptions): UseGpsTrackingReturn {
  const [tracking, setTracking] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<number>(0);
  const watchId = useRef<string | number | null>(null);

  const toggleTracking = useCallback(async () => {
    if (!tracking) {
      try {
        if (Capacitor.isNativePlatform()) {
          const status = await Geolocation.checkPermissions();
          if (status.location !== "granted") {
            const request = await Geolocation.requestPermissions();
            if (request.location !== "granted") {
              onError?.("Permission GPS refusée");
              return;
            }
          }
        }

        setGpsStatus(1);

        const handlePosition = (pos: any) => {
          if (pos && mapRef.current) {
            const { longitude, latitude, accuracy } = pos.coords;
            setGpsAccuracy(accuracy);
            setGpsStatus(2);
            mapRef.current.getView().animate({
              center: fromLonLat([longitude, latitude]),
              zoom: 21,
              duration: 800,
            });
          }
        };

        const handleError = (err: any) => {
          setGpsStatus(err.code === 2 ? 1 : 3);
          onError?.("Erreur GPS : " + (err.message || "Signal perdu"));
        };

        if (Capacitor.getPlatform() === "web") {
          watchId.current = navigator.geolocation.watchPosition(
            handlePosition,
            handleError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          watchId.current = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
            (pos, err) => {
              if (err) handleError(err);
              else handlePosition(pos);
            }
          );
        }

        setTracking(true);
      } catch {
        setGpsStatus(3);
      }
    } else {
      if (watchId.current) {
        if (Capacitor.getPlatform() === "web") {
          navigator.geolocation.clearWatch(watchId.current as number);
        } else {
          await Geolocation.clearWatch({ id: watchId.current as string });
        }
        watchId.current = null;
      }
      setGpsAccuracy(null);
      setGpsStatus(0);
      setTracking(false);
    }
  }, [tracking, mapRef, onError]);

  return { tracking, gpsAccuracy, gpsStatus, toggleTracking };
}