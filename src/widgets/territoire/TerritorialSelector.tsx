import { IonItem, IonLabel, IonSelect, IonSelectOption, IonButton } from "@ionic/react";
import { Territoire } from "../../entities/territoire";
import "./TerritorialSelector.css";

interface TerritorialSelectorProps {
  territoire: Territoire[];
  selectedRegion: number | null;
  selectedDistrict: number | null;
  selectedCommune: number | null;
  selectedFokontany: number | null;
  selectedHameau: number | null;
  onRegionChange: (value: number | null) => void;
  onDistrictChange: (value: number | null) => void;
  onCommuneChange: (value: number | null) => void;
  onFokontanyChange: (value: number | null) => void;
  onHameauChange: (value: number | null) => void;
  onSubmit: () => void;
  submitLabel?: string;
  isForMap?: boolean;
}

const TerritorialSelector: React.FC<TerritorialSelectorProps> = ({
  territoire,
  selectedRegion,
  selectedDistrict,
  selectedCommune,
  selectedFokontany,
  selectedHameau,
  onRegionChange,
  onDistrictChange,
  onCommuneChange,
  onFokontanyChange,
  onHameauChange,
  onSubmit,
  submitLabel = "Enregistrer la configuration",
  isForMap = false,
}) => {
  const handleRegionChange = (value: number) => {
    onRegionChange(value);
    onDistrictChange(null);
    onCommuneChange(null);
    onFokontanyChange(null);
    onHameauChange(null);
  };

  const handleDistrictChange = (value: number) => {
    onDistrictChange(value);
    onCommuneChange(null);
    onFokontanyChange(null);
    onHameauChange(null);
  };

  const handleCommuneChange = (value: number) => {
    onCommuneChange(value);
    onFokontanyChange(null);
    onHameauChange(null);
  };

  const handleFokontanyChange = (value: number) => {
    onFokontanyChange(value);
    onHameauChange(null);
  };

  return (
    <div className="selection-container">
      <IonItem className="selection-item" lines="full">
        <IonLabel position="stacked" color="primary">
          <b>Région</b>
        </IonLabel>
        <IonSelect
          value={selectedRegion}
          placeholder="Sélectionnez une région"
          onIonChange={(e) => handleRegionChange(e.detail.value)}
          interface="action-sheet"
          className="selection-input"
        >
          {territoire.map((region) => (
            <IonSelectOption key={`region-${region.idregion}`} value={region.idregion}>
              {region.nomregion}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      {selectedRegion && (
        <IonItem className="selection-item" lines="full">
          <IonLabel position="stacked" color="primary">
            <b>District</b>
          </IonLabel>
          <IonSelect
            value={selectedDistrict}
            placeholder="Sélectionnez un district"
            onIonChange={(e) => handleDistrictChange(e.detail.value)}
            interface="action-sheet"
            className="selection-input"
          >
            {territoire
              .find((r) => r.idregion === selectedRegion)
              ?.districts.map((district) => (
                <IonSelectOption key={`district-${district.iddistrict}`} value={district.iddistrict}>
                  {district.nomdistrict}
                </IonSelectOption>
              ))}
          </IonSelect>
        </IonItem>
      )}

      {selectedDistrict && (
        <IonItem className="selection-item" lines="full">
          <IonLabel position="stacked" color="primary">
            <b>Commune</b>
          </IonLabel>
          <IonSelect
            value={selectedCommune}
            placeholder="Sélectionnez une commune"
            onIonChange={(e) => handleCommuneChange(e.detail.value)}
            interface="action-sheet"
            className="selection-input"
          >
            {territoire
              .flatMap((r) => r.districts)
              .find((d) => d.iddistrict === selectedDistrict)
              ?.communes.map((commune) => (
                <IonSelectOption key={`commune-${commune.idcommune}`} value={commune.idcommune}>
                  {commune.nomcommune}
                </IonSelectOption>
              ))}
          </IonSelect>
        </IonItem>
      )}

      {selectedCommune && (
        <IonItem className="selection-item" lines="full">
          <IonLabel position="stacked" color="primary">
            <b>Fokontany</b>
          </IonLabel>
          <IonSelect
            value={selectedFokontany}
            placeholder="Sélectionnez un fokontany"
            onIonChange={(e) => handleFokontanyChange(e.detail.value)}
            interface="action-sheet"
            className="selection-input"
          >
            {territoire
              .flatMap((r) => r.districts.flatMap((d) => d.communes))
              .find((c) => c.idcommune === selectedCommune)
              ?.fokontany.map((fokontany) => (
                <IonSelectOption key={`fokontany-${fokontany.idfokontany}`} value={fokontany.idfokontany}>
                  {fokontany.nomfokontany}
                </IonSelectOption>
              ))}
          </IonSelect>
        </IonItem>
      )}

      {selectedFokontany && (
        <IonItem className="selection-item" lines="full">
          <IonLabel position="stacked" color="primary">
            <b>Hameau</b>
          </IonLabel>
          <IonSelect
            value={selectedHameau}
            placeholder="Sélectionnez un hameau"
            onIonChange={(e) => onHameauChange(e.detail.value)}
            interface="action-sheet"
            className="selection-input"
          >
            {territoire
              .flatMap((r) => r.districts)
              .flatMap((d) => d.communes)
              .find((c) => c.idcommune === selectedCommune)
              ?.fokontany.find((f) => f.idfokontany === selectedFokontany)
              ?.hameaux.map((hameau) => (
                <IonSelectOption key={`hameau-${hameau.idhameau}`} value={hameau.idhameau}>
                  {hameau.nomhameau}
                </IonSelectOption>
              ))}
          </IonSelect>
        </IonItem>
      )}

      <div className="ion-text-center ion-margin-top">
        <IonButton
          expand="block"
          onClick={onSubmit}
          disabled={!selectedHameau}
          shape="round"
          className="save-button-tab4"
        >
          {submitLabel}
        </IonButton>
      </div>
    </div>
  );
};

export default TerritorialSelector;

