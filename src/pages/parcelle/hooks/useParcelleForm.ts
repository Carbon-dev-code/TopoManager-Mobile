import { useState, useCallback } from "react";
import { Parcelle, Riverin } from "../../entities/parcelle";
import { Demandeur, PersonnePhysique, PersonneMorale } from "../../entities/demandeur";
import { v4 as uuidv4 } from "uuid";
import { 
  insertDemandeur, 
  insertParcelle, 
  insertPersonneMorale, 
  insertPersonnePhysique 
} from "../../shared/lib/db/DbSchema";

export const useParcelleForm = () => {
  const [parcelle, setParcelle] = useState<Parcelle>(Parcelle.init());
  const [personnePhysique, setPersonnePhysique] = useState<PersonnePhysique>(
    PersonnePhysique.init(),
  );
  const [personneMorale, setPersonneMorale] = useState<PersonneMorale>(
    PersonneMorale.init(),
  );
  const [representanType, setRepresentanType] = useState<string | null>(null);
  const [newRiverin, setNewRiverin] = useState<Riverin>(Riverin.init());
  const [mode, setMode] = useState<"view" | "edit" | "create">("create");
  const [activeTab, setActiveTab] = useState<"demandeur" | "riverin">("demandeur");
  const [decomposed, setDecomposed] = useState(false);
  const [isPhysique, setIsPhysique] = useState(0);

  const resetForm = useCallback(() => {
    setParcelle(Parcelle.init());
    setPersonnePhysique(PersonnePhysique.init());
    setPersonneMorale(PersonneMorale.init());
    setRepresentanType("proprietaire");
    setIsPhysique(0);
    setMode("create");
  }, []);

  const addDemandeur = useCallback(async () => {
    try {
      const newDemandeur = new Demandeur(
        uuidv4(),
        isPhysique === 0 ? 0 : 1,
        personnePhysique,
        personneMorale,
        isPhysique === 0 ? representanType ?? "proprietaire" : null,
      );
      setParcelle((prev: Parcelle) => ({
        ...prev,
        demandeurs: [...prev.demandeurs, newDemandeur],
      }));
      setPersonnePhysique(PersonnePhysique.init());
      setPersonneMorale(PersonneMorale.init());
      setRepresentanType("proprietaire");
      setIsPhysique(0);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      };
    }
  }, [personnePhysique, personneMorale, isPhysique, representanType]);

  const addRiverin = useCallback(() => {
    try {
      setParcelle((prev: Parcelle) => ({
        ...prev,
        riverin: [...prev.riverin, newRiverin],
      }));
      setNewRiverin(Riverin.init());
      return { success: true, message: "Riverin ajouté avec success" };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      };
    }
  }, [newRiverin]);

  const createParcelle = useCallback(async (saveIncrement?: () => Promise<void>) => {
    try {
      for (const d of parcelle.demandeurs) await insertDemandeur(d);
      for (const r of parcelle.riverin) {
        if (r.typePersonne === 0 && r.personnePhysique)
          await insertPersonnePhysique(r.personnePhysique);
        if (r.typePersonne === 1 && r.personneMorale)
          await insertPersonneMorale(r.personneMorale);
      }

      await insertParcelle(parcelle);
      
      if (mode === "create" && saveIncrement) {
        await saveIncrement();
      }

      return { success: true, parcelle };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      };
    }
  }, [parcelle, mode]);

  return {
    parcelle,
    setParcelle,
    personnePhysique,
    setPersonnePhysique,
    personneMorale,
    setPersonneMorale,
    representanType,
    setRepresentanType,
    newRiverin,
    setNewRiverin,
    mode,
    setMode,
    activeTab,
    setActiveTab,
    decomposed,
    setDecomposed,
    isPhysique,
    setIsPhysique,
    resetForm,
    addDemandeur,
    addRiverin,
    createParcelle
  };
};
