import { IonButton, IonIcon } from "@ionic/react";
import {
  closeOutline,
  locationOutline,
  personOutline,
  informationCircleOutline,
  chatbubbleOutline,
  peopleOutline,
} from "ionicons/icons";
import "./CardGlass.css";
import { Parcelle } from "../../entities/parcelle";
import DemandeurView from "../../widgets/demandeur/DemandeurView";
import RiverinView from "../../widgets/riverin/RiverinView";

interface CardGlassProps {
  currentParcelle: Parcelle;
  setShowCard: (show: boolean) => void;
}

const CardGlass: React.FC<CardGlassProps> = ({ currentParcelle, setShowCard }) => {
  return (
    <div className="glass-card-bottom">
      <div className="glass-card-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-code">{currentParcelle.code}</span>
          </div>
          <IonButton
            fill="clear"
            size="small"
            className="close-btn"
            onClick={() => setShowCard(false)}
          >
            <IonIcon icon={closeOutline} />
          </IonButton>
        </div>
      </div>

      <div className="glass-card-content">
        <div className="section-card">
          <div className="section-header">
            <IonIcon icon={locationOutline} className="section-icon" />
            <span className="section-title">Limite administrative</span>
          </div>
          <div className="territoire-grid">
            {[
              {
                label: "Région",
                value: currentParcelle.parametreTerritoire?.region.nomregion,
              },
              {
                label: "District",
                value: currentParcelle.parametreTerritoire?.district.nomdistrict,
              },
              {
                label: "Commune",
                value: currentParcelle.parametreTerritoire?.commune.nomcommune,
              },
              {
                label: "Fokontany",
                value: currentParcelle.parametreTerritoire?.fokontany.nomfokontany,
              },
              {
                label: "Hameau",
                value: currentParcelle.parametreTerritoire?.hameau.nomhameau,
              },
            ].map(({ label, value }) => (
              <div className="territoire-item" key={label}>
                <span className="territoire-label">{label}</span>
                <span className="territoire-value">{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <IonIcon icon={personOutline} className="section-icon" />
            <span className="section-title">Demandeur</span>
            <span className="section-badge">{currentParcelle.demandeurs.length}</span>
          </div>
          <div className="content-demandeur">
            {currentParcelle.demandeurs.map((d, i) => {
              const personne =
                d.type === 0 ? d.personnePhysique : d.personneMorale;
              return (
                <DemandeurView
                  key={i}
                  personne={personne}
                  type={d.type ?? 0}
                  representanType={d.representanType}
                />
              );
            })}
          </div>
        </div>

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

        <div className="section-card">
          <div className="section-header">
            <IonIcon icon={informationCircleOutline} className="section-icon" />
            <span className="section-title">Informations</span>
          </div>
          <div className="info-grid">
            {[
              {
                label: "Date de création",
                value: currentParcelle.dateCreation || "N/A",
              },
              { label: "Catégorie", value: currentParcelle.categorie || "N/A" },
              {
                label: "Consistance",
                value: currentParcelle.consistance || "Aucune",
              },
            ].map(({ label, value }) => (
              <div className="info-row" key={label}>
                <span className="info-label">{label}</span>
                <span className="info-value">{value}</span>
              </div>
            ))}

            <div
              className={`info-flag-block ${
                currentParcelle.oppossition ? "flag-alert" : "flag-ok"
              }`}
            >
              <div className="flag-row">
                <span className="flag-dot" />
                <span className="flag-label">Opposition</span>
                <span className="flag-value">
                  {currentParcelle.oppossition ? "Oui" : "Non"}
                </span>
              </div>
              {currentParcelle.oppossition &&
                currentParcelle.observationOpposition && (
                  <div className="flag-obs">
                    {currentParcelle.observationOpposition}
                  </div>
                )}
            </div>

            <div
              className={`info-flag-block ${
                currentParcelle.revandication ? "flag-alert" : "flag-ok"
              }`}
            >
              <div className="flag-row">
                <span className="flag-dot" />
                <span className="flag-label">Revendication</span>
                <span className="flag-value">
                  {currentParcelle.revandication ? "Oui" : "Non"}
                </span>
              </div>
              {currentParcelle.revandication &&
                currentParcelle.observationRevendication && (
                  <div className="flag-obs">
                    {currentParcelle.observationRevendication}
                  </div>
                )}
            </div>
          </div>
        </div>

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

