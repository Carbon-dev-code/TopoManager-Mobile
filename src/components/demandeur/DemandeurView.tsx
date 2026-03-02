import { IonAvatar, IonIcon, IonItemSliding, IonItem, IonItemOptions, IonItemOption, IonChip } from "@ionic/react";
import { person, business, male, female, calendar, trash } from "ionicons/icons";
import { Demandeur } from "../../model/parcelle/Demandeur";
import "./DemandeurView.css";
import { useRef, useState } from "react";
import DropDownDemandeur from "../../components/dropdown/DropDownDemandeur";

interface DemandeurViewProps {
  demandeur: Demandeur;
  onDelete?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  swipeEnabled?: boolean;
  longPressEnabled?: boolean; // Désactivé par défaut
}

const LONG_PRESS_DELAY = 1000; // ms

const DemandeurView: React.FC<DemandeurViewProps> = ({
  demandeur,
  onDelete,
  onView,
  onEdit,
  swipeEnabled = false,
  longPressEnabled = false,
}) => {
  const isPhysique = demandeur.type === 0;
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const triggerId = `demandeur-trigger-${demandeur.id ?? Math.random().toString(36).slice(2)}`;

  const formatDate = (d: Date | string | null) => {
    if (!d) return "-";
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return "-";

    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // Long press handlers
  const handlePressStart = () => {
    if (!longPressEnabled) return;
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      setShowDropdown(true);
    }, LONG_PRESS_DELAY);
  };

  const handlePressEnd = (e?: React.TouchEvent | React.MouseEvent) => {
    if (!longPressEnabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Ne rien faire — le dropdown s'ouvre via long press uniquement
    if (didLongPress.current) {
      didLongPress.current = false;
    }
  };

  // ⚡ Déterminer le contenu de l'avatar
  const avatarContent =
    demandeur.indexPhoto !== null &&
      demandeur.photos && demandeur.photos[demandeur.indexPhoto]
      ? <img src={demandeur.photos[demandeur.indexPhoto]} alt="Profil" className="person-avatar-img" />
      : isPhysique ? demandeur.nom?.[0].toUpperCase() ?? "?" : demandeur.denomination?.[0].toUpperCase() ?? "?";

  // ⚡ Déterminer l'icône de fond
  const typeIcon = isPhysique ? person : business;

  const cardContent = (
    <div
      id={longPressEnabled ? triggerId : undefined}
      className="person-card"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd} 
      onTouchCancel={handlePressEnd}
      onClick={handleClick}
    >
      <IonIcon icon={typeIcon} className="person-bg-icon" color="primary" />

      <IonAvatar className="person-avatar">{avatarContent}</IonAvatar>

      <div className="person-info">
        {isPhysique ? (
          <>
            <div className="line1">
              <span className="prenom">{demandeur.prenom}</span>
              <span className="nom">{demandeur.nom}</span>
            </div>
            <div className="line2">
              <IonChip className="chip row g-0" color="secondary">
                <div className="col-auto d-flex me-1">
                  <IonIcon icon={calendar} />
                </div>
                <div className="col">
                  <span>{formatDate(demandeur.dateNaissance)}</span>
                </div>
              </IonChip>
              <IonChip className="chip row g-0" color="tertiary" >
                <div className="col-auto d-flex me-1">
                  <IonIcon icon={Number(demandeur.sexe) === 1 ? male : female} />
                </div>
                <div className="col">
                  {Number(demandeur.sexe) === 1 ? "M" : "F"}
                </div>
              </IonChip>
            </div>
          </>
        ) : (
          <>
            <div className="line1">
              <span className="denomination">{demandeur.denomination}</span>
            </div>
            <div className="line2">
              <IonIcon icon={calendar} /> {demandeur.dateCreation}
              <IonIcon icon={business} /> {demandeur.siege}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Si swipe est désactivé
  if (!swipeEnabled) {
    return (
      <>
        {cardContent}
        {longPressEnabled && (
          <DropDownDemandeur
            show={showDropdown}
            triggerId={triggerId}
            onClose={() => setShowDropdown(false)}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </>
    );
  }

  // Si swipe est activé
  return (
    <>
      <IonItemSliding className="demandeur-sliding">
        <IonItem lines="none" className="ion-no-padding">
          {cardContent}
        </IonItem>

        <IonItemOptions side="end" onIonSwipe={onDelete}>
          <IonItemOption color="danger" expandable onClick={onDelete}>
            <IonIcon icon={trash} slot="icon-only" />
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>

      {longPressEnabled && (
        <DropDownDemandeur
          show={showDropdown}
          triggerId={triggerId}
          onClose={() => setShowDropdown(false)}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default DemandeurView;