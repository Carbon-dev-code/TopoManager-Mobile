import { useState, useCallback } from "react";
import { Preferences } from "@capacitor/preferences";
import { ParametreTerritoire } from "../../entities/territoire";

export const useParcelleCode = () => {
  const [currentIncrement, setCurrentIncrement] = useState(0);
  const [parametreTerritoire, setParametreTerritoire] =
    useState<ParametreTerritoire | null>(null);

  const generateNextCode = useCallback(async () => {
    try {
      const [parametrePref, devicePref] = await Promise.all([
        Preferences.get({ key: "parametreActuel" }),
        Preferences.get({ key: "device_id" }),
      ]);
      if (!parametrePref.value || !devicePref.value) return null;

      const parametreActuel = JSON.parse(parametrePref.value);
      const deviceId = JSON.parse(devicePref.value);
      const newIncrement = (parametreActuel.increment || 0) + 1;
      const { region, district, commune, fokontany, hameau } = parametreActuel;
      const code = `${deviceId}-${region.coderegion}-${district.codedistrict}-${commune.codecommune}-${fokontany.codefokontany}-${hameau?.codehameau}-${newIncrement}`;

      setCurrentIncrement(newIncrement);
      setParametreTerritoire(parametreActuel);

      const now = new Date();
      const dateTime = now
        .toLocaleString("fr-FR", {
          timeZone: "Indian/Antananarivo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(/(\d{2})\/(\d{2})\/(\d{4}),?\s/, "$3-$2-$1 ");

      return {
        code,
        dateCreation: dateTime,
        parametreTerritoire: parametreActuel,
      };
    } catch (error) {
      console.error("Erreur génération code parcelle:", error);
      return null;
    }
  }, []);

  const saveIncrement = useCallback(async () => {
    try {
      const parametrePref = await Preferences.get({ key: "parametreActuel" });
      if (!parametrePref.value) throw new Error("Paramètres non configurés");
      const parametreActuel = JSON.parse(parametrePref.value);
      await Preferences.set({
        key: "parametreActuel",
        value: JSON.stringify({
          ...parametreActuel,
          increment: currentIncrement,
        }),
      });
    } catch (error) {
      console.error("Erreur sauvegarde incrément:", error);
      throw error;
    }
  }, [currentIncrement]);

  return { parametreTerritoire, generateNextCode, saveIncrement };
};
