import React from "react";
import { IonList, IonItem, IonGrid, IonRow, IonCol, IonInput, IonSelect, IonSelectOption, IonCheckbox, IonButton, IonSegment, IonSegmentButton, IonLabel, IonTextarea, } from "@ionic/react";
import { Parcelle } from "../../model/parcelle/Parcelle";
import { Categorie } from "../../model/Categorie";
import { Status } from "../../model/Status";
import { ParametreTerritoire } from "../../model/ParametreTerritoire";
import DemandeurView from "../demandeur/DemandeurView";
import Photo from "../photo/Photo";
import RiverinView from "../riverin/RiverinView";
import CategorySelect from "../categorie/CategorySelect";

interface ParcelleFormProps {
     mode: "view" | "edit" | "create";
     parcelle: Parcelle;
     setParcelle: (parcelle: Parcelle | ((prev: Parcelle) => Parcelle)) => void;
     categorie: Categorie[];
     onCategoriesChange: (categories: Categorie[]) => void; // 👈 ajouté
     status: Status[];
     parametreTerritoire: ParametreTerritoire | null;
     activeTab: "demandeur" | "riverin";
     setActiveTab: (tab: "demandeur" | "riverin") => void;
     decomposed: boolean;
     setDecomposed: (decomposed: boolean) => void;
     takePhotoParcelle: () => void;
     onCreateParcelle: () => void;
     onShowDemandeurModal: () => void;
     onShowSearchModal: () => void;
     onShowRiverinModal: () => void;
}

const ParcelleForm: React.FC<ParcelleFormProps> = ({
     mode,
     parcelle, setParcelle, categorie,
     onCategoriesChange, 
     status, parametreTerritoire,
     activeTab, setActiveTab, decomposed,
     setDecomposed,
     takePhotoParcelle,
     onCreateParcelle,
     onShowDemandeurModal,
     onShowSearchModal,
     onShowRiverinModal,
}) => {

     const isDisabled = mode === "view";

     const updateField = <K extends keyof Parcelle>(field: K, value: Parcelle[K]) => {
          setParcelle((prev) => ({ ...prev, [field]: value }));
     };

     const removeDemandeur = (index: number) => {
          setParcelle((prev) => ({
               ...prev,
               demandeurs: prev.demandeurs.filter((_, i) => i !== index)
          }));
     };

     const removeRiverin = (index: number) => {
          setParcelle((prev) => ({
               ...prev,
               riverin: prev.riverin.filter((_, i) => i !== index)
          }));
     };

     return (
          <>
               <IonList>
                    {/* Date et Code */}
                    <IonItem>
                         <IonGrid>
                              <IonRow>
                                   <IonCol size="12">
                                        <IonInput
                                             labelPlacement="floating"
                                             type="datetime-local"
                                             value={parcelle.dateCreation}
                                             readonly
                                        >
                                             <div slot="label">En date du</div>
                                        </IonInput>
                                   </IonCol>
                                   <IonCol size="12">
                                        <IonInput
                                             labelPlacement="floating"
                                             type="text"
                                             readonly
                                             value={parcelle.code}
                                        >
                                             <div slot="label">Code parcelle</div>
                                        </IonInput>
                                   </IonCol>
                              </IonRow>
                         </IonGrid>
                    </IonItem>

                    {/* Status et Durée */}
                    <IonItem>
                         <IonGrid>
                              <IonRow>
                                   <IonCol size="12">
                                        <IonSelect
                                             disabled={isDisabled}
                                             label="Status :"
                                             value={String(parcelle.status)}
                                             onIonChange={(e) => updateField("status", Number(e.detail.value))}
                                             placeholder="Status de terre"
                                             interface="alert"
                                        >
                                             {status.map((s) => (
                                                  <IonSelectOption key={`status-${s.id}`} value={s.id}>
                                                       {s.labelstatus}
                                                  </IonSelectOption>
                                             ))}
                                        </IonSelect>
                                   </IonCol>
                                   <IonCol size="12">
                                        <IonInput
                                             label="Durée d'occupation :"
                                             type="number"
                                             onIonChange={(e) => updateField("anneeOccup", Number(e.detail.value))}
                                             placeholder="Nombre d'année"
                                             readonly={isDisabled}
                                             value={parcelle.anneeOccup}
                                        />
                                   </IonCol>
                              </IonRow>
                         </IonGrid>
                    </IonItem>

                    {/* Catégorie et Consistance */}
                    <IonItem>
                         <IonGrid>
                              <IonRow>
                                   <IonCol size="12">
                                        <CategorySelect
                                             categories={categorie}
                                             value={parcelle.categorie}
                                             disabled={isDisabled}
                                             onSelect={(cat) => updateField("categorie", cat)}
                                             onCategoriesChange={onCategoriesChange} 
                                        />
                                   </IonCol>
                                   <IonCol size="12">
                                        <IonInput
                                             label="Consistance :"
                                             type="text"
                                             onIonChange={(e) => updateField("consistance", String(e.detail.value))}
                                             placeholder="Consistance du terrain"
                                             readonly={isDisabled}
                                             value={parcelle.consistance}
                                        />
                                   </IonCol>
                              </IonRow>
                         </IonGrid>
                    </IonItem>

                    {/* Opposition et Revendication */}
                    <IonItem>
                         <IonGrid>
                              <IonRow>
                                   <IonCol size="12">
                                        <IonCheckbox
                                             labelPlacement="start"
                                             onIonChange={(e) => updateField("oppossition", e.detail.checked)}
                                             checked={parcelle.oppossition}
                                             disabled={isDisabled}
                                        >
                                             Opposition
                                        </IonCheckbox>
                                   </IonCol>
                                   <IonCol size="12">
                                        <IonCheckbox
                                             disabled={isDisabled} labelPlacement="start"
                                             checked={parcelle.revandication}
                                             onIonChange={(e) => updateField("revandication", e.detail.checked)}
                                        >
                                             Revendication
                                        </IonCheckbox>
                                   </IonCol>
                              </IonRow>
                         </IonGrid>
                    </IonItem>

                    {/* Boutons d'action */}
                    {mode != "view" && (
                         <IonItem>
                              <IonGrid>
                                   <IonRow className="justify-content-between text-center">
                                        <IonCol size="12" size-md="4">
                                             <IonButton expand="full" onClick={onShowDemandeurModal} disabled={isDisabled}>
                                                  Ajout demandeur
                                             </IonButton>
                                        </IonCol>
                                        <IonCol size="12" size-md="4">
                                             <IonButton expand="full" color="tertiary" onClick={onShowSearchModal} disabled={isDisabled}>
                                                  Recherche demandeur
                                             </IonButton>
                                        </IonCol>
                                        <IonCol size="12" size-md="4">
                                             <IonButton expand="full" onClick={onShowRiverinModal} disabled={isDisabled}>
                                                  Ajout riverain
                                             </IonButton>
                                        </IonCol>
                                   </IonRow>
                              </IonGrid>
                         </IonItem>
                    )}

                    {/* Tabs Demandeurs/Riverains */}
                    <div className="tabs-wrapper">
                         <div className="tabs-header">
                              <IonSegment
                                   value={activeTab}
                                   onIonChange={(e) => setActiveTab(e.detail.value as "demandeur" | "riverin")}
                              >
                                   <IonSegmentButton value="demandeur">
                                        <IonLabel>Demandeurs</IonLabel>
                                   </IonSegmentButton>
                                   <IonSegmentButton value="riverin">
                                        <IonLabel>Riverains</IonLabel>
                                   </IonSegmentButton>
                              </IonSegment>
                         </div>

                         <div className="tab-content-scroll">
                              {activeTab === "demandeur" && (
                                   <div className="demandeur-list">
                                        {parcelle.demandeurs?.length === 0 && (
                                             <div className="empty-state">
                                                  Aucun demandeur enregistré
                                             </div>
                                        )}
                                        {parcelle.demandeurs.map((d, i) => (
                                             <DemandeurView
                                                  key={i}
                                                  demandeur={d}
                                                  swipeEnabled={mode !== "view"}
                                                  onDelete={mode !== "view" ? () => removeDemandeur(i) : undefined}
                                             />
                                        ))}
                                   </div>
                              )}

                              {activeTab === "riverin" && (
                                   <div className="riverin-list">
                                        {parcelle.riverin?.length === 0 && (
                                             <div className="empty-state">
                                                  Aucun riverain enregistré
                                             </div>
                                        )}
                                        {parcelle.riverin?.map((r, i) => (
                                             <RiverinView
                                                  key={i}
                                                  riverin={r}
                                                  swipeEnabled={mode !== "view"}
                                                  onDelete={mode !== "view" ? () => removeRiverin(i) : undefined}
                                             />
                                        ))}
                                   </div>
                              )}
                         </div>
                    </div>

                    {/* Photos */}
                    {mode != "view" && (
                         <IonItem>
                              <Photo
                                   photos={parcelle.photos}
                                   decomposed={decomposed}
                                   setDecomposed={setDecomposed}
                                   takePhoto={takePhotoParcelle}
                                   clearPhotos={() => updateField("photos", [])}
                                   name="Prendre une photo de groupe"
                              />
                         </IonItem>
                    )}

                    {/* Informations territoriales */}
                    <IonItem>
                         <IonGrid className="ion-margin-bottom">
                              <IonRow className="ion-wrap ion-gap">
                                   {[
                                        { label: "Région", value: parametreTerritoire?.region.nomregion },
                                        { label: "District", value: parametreTerritoire?.district.nomdistrict },
                                        { label: "Commune", value: parametreTerritoire?.commune.nomcommune },
                                        { label: "Fokontany", value: parametreTerritoire?.fokontany.nomfokontany },
                                        { label: "Hameau", value: parametreTerritoire?.hameau?.nomhameau },
                                   ].map(({ label, value }) => (
                                        <IonCol key={label} size-md="4" size-lg="2">
                                             <div className="ion-text-wrap">
                                                  <small className="ion-text-muted">{label}</small>
                                                  <div><strong>{value}</strong></div>
                                             </div>
                                        </IonCol>
                                   ))}
                              </IonRow>
                         </IonGrid>
                    </IonItem>

                    {/* Observation */}
                    <IonItem>
                         <IonGrid>
                              <IonRow>
                                   <IonCol size="12">
                                        <IonTextarea
                                             label="Observation"
                                             onIonChange={(e) => updateField("observation", e.detail.value || "")}
                                             labelPlacement="stacked"
                                             placeholder="Votre observation sur la parcelle"
                                             disabled={isDisabled}
                                             value={parcelle.observation}
                                        />
                                   </IonCol>
                              </IonRow>
                         </IonGrid>
                    </IonItem>
               </IonList>

               {mode !== "view" && (
                    <IonButton expand="full" onClick={onCreateParcelle}>
                         {mode === "edit" ? "Mettre à jour" : "Enregistrer la parcelle"}
                    </IonButton>
               )}
          </>
     );
};

export default ParcelleForm;