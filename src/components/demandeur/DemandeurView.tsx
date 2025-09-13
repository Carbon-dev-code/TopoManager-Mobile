import { IonAvatar, IonIcon } from "@ionic/react";
import { person, business, male, female, calendar } from "ionicons/icons";
import { Demandeur } from "../../model/parcelle/Demandeur";
import "./DemandeurView.css";

interface DemandeurViewProps {
  demandeur: Demandeur;
}

const DemandeurView: React.FC<DemandeurViewProps> = ({ demandeur }) => {
  const isPhysique = demandeur.type === 0;

  const formatDate = (d: Date | string | null) => {
    if (!d) return "-";
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return "-";

    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  };


  // ⚡ Déterminer le contenu de l'avatar
  const avatarContent =
    demandeur.indexPhoto !== null &&
      demandeur.photos &&
      demandeur.photos[demandeur.indexPhoto]
      ? <img src={demandeur.photos[demandeur.indexPhoto]} alt="Profil" className="person-avatar-img" />
      : isPhysique
        ? demandeur.nom?.[0].toUpperCase() ?? "?"
        : demandeur.denomination?.[0].toUpperCase() ?? "?";

  // ⚡ Déterminer l'icône de fond
  const typeIcon = isPhysique ? person : business;

  return (
    <div className="person-card">
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
              <IonIcon icon={calendar} /> {formatDate(demandeur.dateNaissance)}
              <IonIcon icon={Number(demandeur.sexe) === 1 ? male : female} /> {Number(demandeur.sexe) === 1 ? "M" : "F"}
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
};

export default DemandeurView;