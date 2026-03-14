import { useState, useCallback } from "react";
import { Preferences } from "@capacitor/preferences";
import { Categorie, Status } from "../../../entities/reference";
import { Repere } from "../../../entities/parcelle/model/Repere";

export const useReferenceData = () => {
  const [categorie, setCategorie] = useState<Categorie[]>([]);
  const [status, setStatus] = useState<Status[]>([]);
  const [repereL, setRepere] = useState<Repere[]>([]);

  const loadReferenceData = useCallback(async () => {
    const [categorieData, statusData, repereData] = await Promise.all([
      Preferences.get({ key: "categorieData" }),
      Preferences.get({ key: "statusData" }),
      Preferences.get({ key: "repereData" }),
    ]);
    if (categorieData.value) setCategorie(JSON.parse(categorieData.value));
    if (statusData.value) setStatus(JSON.parse(statusData.value));
    if (repereData.value) setRepere(JSON.parse(repereData.value));
  }, []);

  return { categorie, setCategorie, status, repereL, loadReferenceData };
};
