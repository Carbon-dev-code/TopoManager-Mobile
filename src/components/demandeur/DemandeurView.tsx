import { IonAvatar } from "@ionic/react";
import { Demandeur } from "../../model/parcelle/Demandeur";
import "./DemandeurView.css";

interface DemandeurViewProps {
  demandeur: Demandeur;
}

const DemandeurView: React.FC<DemandeurViewProps> = ({ demandeur }) => {
  const avatarContent =
    demandeur.indexPhoto !== null &&
    demandeur.photos &&
    demandeur.photos[demandeur.indexPhoto]
      ? (
        <img
          src={demandeur.photos[demandeur.indexPhoto]}
          alt="Profil"
          className="person-avatar-img"
        />
      )
      : (demandeur.nom ? demandeur.nom[0].toUpperCase() : "?");

  return (
    <div className="person-card">
      <IonAvatar className="person-avatar">{avatarContent}</IonAvatar>
      <div className="person-info">
        <span className="prenom">{demandeur.prenom}</span>
        <span className="nom">{demandeur.nom}</span>
      </div>
    </div>
  );
};

export default DemandeurView;