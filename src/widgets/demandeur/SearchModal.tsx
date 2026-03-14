import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonModal,
  IonSearchbar,
  IonActionSheet,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useEffect, useState } from "react";
import "./SearchModal.css";
import DemandeurView from "./DemandeurView";
import {
  getAllPersonnesPhysiques,
  getAllPersonnesMorales,
} from "../../shared/lib/db/DbSchema";
import { PersonnePhysique, PersonneMorale, Demandeur } from "../../entities/demandeur";
import { v4 as uuidv4 } from "uuid";

type PersonneWithType =
  | { type: 0; personne: PersonnePhysique }
  | { type: 1; personne: PersonneMorale };

interface SearchModalProps {
  showSearchModal: boolean;
  setShowSearchModal: (b: boolean) => void;
  onSelect: (d: Demandeur, role?: string) => void;
  withRole?: boolean;
  roles?: { text: string; data: string }[];
}

const ROLES_PHYSIQUE = [
  { text: "Propriétaire", data: "proprietaire" },
  { text: "Tuteur légal", data: "tuteurLegal" },
];

const SearchModal: React.FC<SearchModalProps> = ({
  showSearchModal,
  setShowSearchModal,
  onSelect,
  withRole = false,
  roles = ROLES_PHYSIQUE,
}) => {
  const [query, setQuery] = useState("");
  const [allPersonnes, setAllPersonnes] = useState<PersonneWithType[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [showRoleSheet, setShowRoleSheet] = useState(false);
  const [selected, setSelected] = useState<PersonneWithType | null>(null);

  useEffect(() => {
    if (!showSearchModal) return;
    const load = async () => {
      const [physiques, morales] = await Promise.all([
        getAllPersonnesPhysiques(),
        getAllPersonnesMorales(),
      ]);
      const combined: PersonneWithType[] = [
        ...physiques.map((p) => ({ type: 0 as const, personne: p })),
        ...morales.map((p) => ({ type: 1 as const, personne: p })),
      ];
      setAllPersonnes(combined);

      const saved = localStorage.getItem("recentSearches");
      if (saved) setRecentIds(JSON.parse(saved));
    };
    load();
  }, [showSearchModal]);

  const filtered = (() => {
    const pool = query
      ? allPersonnes
      : allPersonnes.filter((p) => recentIds.includes(p.personne.id));

    if (!query) return pool;

    const q = query.toLowerCase();
    return pool.filter((p) => {
      if (p.type === 0) {
        const pp = p.personne as PersonnePhysique;
        return `${pp.prenom ?? ""} ${pp.nom ?? ""}`.toLowerCase().includes(q);
      } else {
        const pm = p.personne as PersonneMorale;
        return (pm.denomination ?? "").toLowerCase().includes(q);
      }
    });
  })();

  const saveRecent = (id: string) => {
    setRecentIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev;
      const updated = [id, ...prev].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  };

  const buildDemandeur = (p: PersonneWithType, role: string | null): Demandeur => {
    return new Demandeur(
      uuidv4(),
      p.type,
      p.type === 0 ? (p.personne as PersonnePhysique) : PersonnePhysique.init(),
      p.type === 1 ? (p.personne as PersonneMorale) : PersonneMorale.init(),
      role,
    );
  };

  const handleSelect = (p: PersonneWithType) => {
    if (!withRole) {
      onSelect(buildDemandeur(p, null));
      saveRecent(p.personne.id);
      setShowSearchModal(false);
      return;
    }

    if (p.type === 1) {
      onSelect(buildDemandeur(p, "representant"));
      saveRecent(p.personne.id);
      setShowSearchModal(false);
      return;
    }

    setSelected(p);
    setShowRoleSheet(true);
  };

  return (
    <>
      <IonModal isOpen={showSearchModal} onDidDismiss={() => setShowSearchModal(false)}>
        <IonContent className="ion-padding">
          <div className="search-header">
            <IonButtons slot="start">
              <IonButton
                fill="clear"
                onClick={() => setShowSearchModal(false)}
              >
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>

            <IonSearchbar
              value={query}
              placeholder="Rechercher un demandeur..."
              onIonInput={(e) => setQuery(e.detail.value!)}
            />
          </div>

          {filtered.map((p) => (
            <div
              key={`${p.type}-${p.personne.id}`}
              className="mb-2"
              onClick={() => handleSelect(p)}
            >
              <DemandeurView personne={p.personne} type={p.type} />
            </div>
          ))}
        </IonContent>
      </IonModal>

      <IonActionSheet
        isOpen={showRoleSheet}
        header="Choisir le rôle"
        onDidDismiss={() => {
          setShowRoleSheet(false);
          setSelected(null);
        }}
        buttons={[
          ...roles.map((r) => ({
            text: r.text,
            handler: () => {
              if (!selected) return;
              onSelect(buildDemandeur(selected, r.data), r.data);
              saveRecent(selected.personne.id);
              setShowRoleSheet(false);
              setShowSearchModal(false);
              setSelected(null);
            },
          })),
          {
            text: "Annuler",
            role: "cancel",
            handler: () => {
              setShowRoleSheet(false);
              setSelected(null);
            },
          },
        ]}
      />
    </>
  );
};

export default SearchModal;
