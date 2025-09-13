import { IonAvatar } from "@ionic/react";
import { Demandeur } from "../../model/parcelle/Demandeur";

interface DemandeurViewProps {
    demandeur: Demandeur;
}
const DemandeurView: React.FC<DemandeurViewProps> = ({
    demandeur
}) => {
    return (
        <div className="person-card">
            <IonAvatar className="person-avatar">R</IonAvatar>
            <div className="person-info">
                <span className="prenom">{demandeur.prenom}</span>
                <span className="nom">{demandeur.nom}</span>
            </div>
        </div>
    );
}
export default DemandeurView;