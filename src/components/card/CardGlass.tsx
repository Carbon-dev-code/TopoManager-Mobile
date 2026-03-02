import { IonButton, IonIcon, IonLabel } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import "./CardGlass.css";
import { Parcelle } from "../../model/parcelle/Parcelle";
import DemandeurView from "../demandeur/DemandeurView";

interface CardGlass {
    currentParcelle: Parcelle;
    setShowCard: (show: boolean) => void;
}

const CardGlass: React.FC<CardGlass> = ({
    currentParcelle,
    setShowCard
}) => {

    return (
        <div className="glass-card-bottom">
            <div className="glass-card-header">
                <IonLabel> Parcelle : <span className="taille">{currentParcelle.code}</span> </IonLabel>
                <IonButton
                    fill="clear"
                    size="small"
                    color="danger"
                    onClick={() => setShowCard(false)}
                >
                    <IonIcon icon={closeOutline} style={{ fontSize: "10px" }} />
                </IonButton>
            </div>
            

            <div className="glass-card-content">
                <div className="territoire">
                    <p>Région: <span>{currentParcelle.parametreTerritoire?.region.nomregion}</span></p>
                    <p>District: <span>{currentParcelle.parametreTerritoire?.district.nomdistrict}</span></p>
                    <p>Commune: <span>{currentParcelle.parametreTerritoire?.commune.nomcommune}</span></p>
                    <p>Fokontany: <span>{currentParcelle.parametreTerritoire?.fokontany.nomfokontany}</span></p>
                    <p>Hameau: <span>{currentParcelle.parametreTerritoire?.hameau.nomhameau}</span></p>
                </div>

                <div className="demandeur">
                    <strong>Demandeur</strong>
                    <div className="content-demandeur">
                        {currentParcelle.demandeurs.map((demandeur, index) => (
                            <DemandeurView key={demandeur.id || index} demandeur={demandeur} />
                        ))}
                    </div>
                </div>

                <div className="other-info-parcelle">
                    <p>Date de création: {currentParcelle.dateCreation || "N/A"}</p>
                    <p>Consistance: {currentParcelle.consistance || "Aucune"}</p>
                    <p>Opposition: {currentParcelle.oppossition ? "Oui" : "Non"}</p>
                    <p>Revandication: {currentParcelle.revandication ? "Oui" : "Non"}</p>
                </div>

                <div className="obs-parcelle">
                    <strong>Observation:</strong>
                    <div className="obs-parcelle-content">
                        {currentParcelle.observation || "Aucune"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardGlass;