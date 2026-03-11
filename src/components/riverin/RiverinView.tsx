import React from "react";
import {
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonItem,
} from "@ionic/react";
import { trash } from "ionicons/icons";
import { Riverin } from "../../model/parcelle/Riverin";
import "./RiverinView.css";

interface Props {
  riverin: Riverin;
  onDelete?: () => void;
  swipeEnabled?: boolean;
}

const RiverinView: React.FC<Props> = ({
  riverin,
  onDelete,
  swipeEnabled = false,
}) => {

  const capitalize = (value?: string | null): string => {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const getDirectionClass = (repere?: string | null) => {
    if (!repere) return "";
    const r = repere.toLowerCase();
    if (r.includes("nord")) return "dir-nord";
    if (r.includes("sud")) return "dir-sud";
    if (r.includes("est")) return "dir-est";
    if (r.includes("ouest")) return "dir-ouest";
    return "";
  };

  const cardContent = (
    <div className={`riverin-card ${getDirectionClass(riverin.repere)}`}>
      <div className="riverin-top">
        <div className="riverin-label">
          Riverain – {capitalize(riverin.repere)}
        </div>
      </div>
      <div className="riverin-body">
        <div className="riverin-name">
          <div className="riverin-name">
            {riverin.type === "autre"
              ? capitalize(riverin.nom) : riverin.typePersonne === 0
              ? `${riverin.personnePhysique?.prenom ?? ""} ${ riverin.personnePhysique?.nom ?? "" }`.trim()
              : riverin.personneMorale?.denomination ?? ""}
          </div>
        </div>
        {riverin.observation && (
          <div className="riverin-note">
            {" "}
            {capitalize(riverin.observation)}{" "}
          </div>
        )}
      </div>
    </div>
  );

  if (!swipeEnabled) return cardContent;

  // Swipe activé mais card full-width
  return (
    <IonItemSliding className="riverin-sliding">
      <IonItem lines="none" className="ion-no-padding">
        {cardContent}
      </IonItem>

      <IonItemOptions side="end" onIonSwipe={onDelete}>
        <IonItemOption color="danger" expandable onClick={onDelete}>
          <IonIcon icon={trash} slot="icon-only" />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default RiverinView;
