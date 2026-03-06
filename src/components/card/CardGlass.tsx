import { IonButton, IonIcon} from "@ionic/react";
import { closeOutline, locationOutline, personOutline, informationCircleOutline, chatbubbleOutline, peopleOutline } from "ionicons/icons";
import "./CardGlass.css";
import { Parcelle } from "../../model/parcelle/Parcelle";
import DemandeurView from "../demandeur/DemandeurView";
import RiverinView from "../riverin/RiverinView";

interface CardGlass {
    currentParcelle: Parcelle;
    setShowCard: (show: boolean) => void;
}

const CardGlass: React.FC<CardGlass> = ({ currentParcelle, setShowCard }) => {
    return (
        <div className="glass-card-bottom">
            {/* Header */}
            <div className="glass-card-header">
                <div className="header-pill" />
                <div className="header-content">
                    <div className="header-title">
                        <span className="header-label">Parcelle</span>
                        <span className="header-code">{currentParcelle.code}</span>
                    </div>
                    <IonButton fill="clear" size="small" className="close-btn" onClick={() => setShowCard(false)}>
                        <IonIcon icon={closeOutline} />
                    </IonButton>
                </div>
            </div>

            <div className="glass-card-content">

                {/* Territoire */}
                <div className="section-card">
                    <div className="section-header">
                        <IonIcon icon={locationOutline} className="section-icon" />
                        <span className="section-title">Limite administrative</span>
                    </div>
                    <div className="territoire-grid">
                        {[
                            { label: "Région", value: currentParcelle.parametreTerritoire?.region.nomregion },
                            { label: "District", value: currentParcelle.parametreTerritoire?.district.nomdistrict },
                            { label: "Commune", value: currentParcelle.parametreTerritoire?.commune.nomcommune },
                            { label: "Fokontany", value: currentParcelle.parametreTerritoire?.fokontany.nomfokontany },
                            { label: "Hameau", value: currentParcelle.parametreTerritoire?.hameau.nomhameau },
                        ].map(({ label, value }) => (
                            <div className="territoire-item" key={label}>
                                <span className="territoire-label">{label}</span>
                                <span className="territoire-value">{value || "—"}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Demandeurs */}
                <div className="section-card">
                    <div className="section-header">
                        <IonIcon icon={personOutline} className="section-icon" />
                        <span className="section-title">Demandeur</span>
                        <span className="section-badge">{currentParcelle.demandeurs.length}</span>
                    </div>
                    <div className="content-demandeur">
                        {currentParcelle.demandeurs.map((demandeur, index) => (
                            <DemandeurView key={demandeur.id || index} demandeur={demandeur} />
                        ))}
                    </div>
                </div>

                {/* Riverains */}
                <div className="section-card">
                    <div className="section-header">
                        <IonIcon icon={peopleOutline} className="section-icon" />
                        <span className="section-title">Riverain</span>
                        <span className="section-badge">{currentParcelle.riverin.length}</span>
                    </div>
                    <div className="content-riverin">
                        {currentParcelle.riverin.map((riverin, index) => (
                            <RiverinView key={index} riverin={riverin} />
                        ))}
                    </div>
                </div>

                {/* Informations */}
                <div className="section-card">
                    <div className="section-header">
                        <IonIcon icon={informationCircleOutline} className="section-icon" />
                        <span className="section-title">Informations</span>
                    </div>
                    <div className="info-grid">
                        {[
                            { label: "Date de création du parcelle", value: currentParcelle.dateCreation || "N/A" },
                            { label: "Catégorie", value: currentParcelle.categorie || "N/A" },
                            { label: "Consistance", value: currentParcelle.consistance || "Aucune" },
                            { label: "Opposition", value: currentParcelle.oppossition ? "Oui" : "Non", highlight: currentParcelle.oppossition },
                            { label: "Revendication", value: currentParcelle.revandication ? "Oui" : "Non", highlight: currentParcelle.revandication },
                        ].map(({ label, value, highlight }) => (
                            <div className="info-row" key={label}>
                                <span className="info-label">{label}</span>
                                <span className={`info-value ${highlight ? "info-alert" : ""}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Observation */}
                <div className="section-card">
                    <div className="section-header">
                        <IonIcon icon={chatbubbleOutline} className="section-icon" />
                        <span className="section-title">Observation</span>
                    </div>
                    <div className="obs-content">
                        {currentParcelle.observation || "Aucune observation enregistrée."}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CardGlass;