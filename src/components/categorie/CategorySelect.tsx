import React, { useState } from "react";
import { IonModal, IonIcon, IonItemSliding, IonItem, IonItemOptions, IonItemOption } from "@ionic/react";
import { addOutline, checkmarkOutline, close, pricetagOutline, trashOutline, caretDownOutline } from "ionicons/icons";
import { Preferences } from "@capacitor/preferences";
import { Categorie } from "../../model/Categorie";
import "./CategorySelect.css";

interface CategorySelectProps {
     categories: Categorie[];
     value: string | null;         // 👈 le label, pas l'id
     disabled?: boolean;
     onSelect: (label: string) => void;  // 👈 retourne juste le label
     onCategoriesChange: (categories: Categorie[]) => void;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
     categories,
     value,
     disabled = false,
     onSelect,
     onCategoriesChange,
}) => {
     const [showModal, setShowModal] = useState(false);
     const [showCreateInput, setShowCreateInput] = useState(false);
     const [newLabel, setNewLabel] = useState("");
     const [creating, setCreating] = useState(false);

     // Majuscule première lettre
     const capitalize = (str: string) =>
          str.charAt(0).toUpperCase() + str.slice(1);

     const handleOpen = () => {
          if (disabled) return;
          setShowModal(true);
          setShowCreateInput(false);
          setNewLabel("");
     };

     const handleClose = () => {
          setShowModal(false);
          setShowCreateInput(false);
          setNewLabel("");
     };

     const handleSelect = (cat: Categorie) => {
          onSelect(cat.labelcategorie);
          handleClose();
     };

     const handleCreate = async () => {
          const label = capitalize(newLabel.trim());
          if (!label) return;
          setCreating(true);
          try {
               const newId = Date.now();
               const newCategorie: Categorie = {
                    idcategorie: newId,
                    labelcategorie: label,
               };
               const updatedList = [...categories, newCategorie];
               await Preferences.set({
                    key: "categorieData",
                    value: JSON.stringify(updatedList),
               });
               onCategoriesChange(updatedList);
               onSelect(label); // 👈 on envoie le label directement
               handleClose();
          } catch (error) {
               console.error("Erreur création catégorie:", error);
          } finally {
               setCreating(false);
          }
     };

     const handleDelete = async (cat: Categorie) => {
          const updatedList = categories.filter((c) => c.idcategorie !== cat.idcategorie);
          await Preferences.set({
               key: "categorieData",
               value: JSON.stringify(updatedList),
          });
          onCategoriesChange(updatedList);
          // Si la catégorie supprimée était sélectionnée, reset
          if (value === cat.labelcategorie) {
               onSelect("");
          }
     };

     return (
          <>
               {/* Trigger */}
               <div
                    className={`cs-trigger ${disabled ? "cs-trigger-disabled" : ""}`}
                    onClick={handleOpen}
               >
                    <span className="cs-trigger-label">Catégorie :</span>
                    <span className={`cs-trigger-value ${!value ? "cs-trigger-placeholder" : ""}`}>
                         {value ? value : "Catégorie de terre"}
                    </span>
                    <IonIcon icon={caretDownOutline} className="cs-trigger-arrow" />
               </div>

               <IonModal isOpen={showModal} onDidDismiss={handleClose} className="cs-modal" keepContentsMounted={false}>
                    <div className="cs-popup">

                         {/* Header */}
                         <div className="cs-popup-header">
                              <div className="cs-popup-title">
                                   <IonIcon icon={pricetagOutline} className="cs-popup-title-icon" />
                                   <span>Catégorie de terre</span>
                              </div>
                              <button className="cs-close-btn" onClick={handleClose}>
                                   <IonIcon icon={close} />
                              </button>
                         </div>

                         {/* Liste */}
                         <div className="cs-list">
                              {categories.length === 0 && (
                                   <div className="cs-empty">Aucune catégorie disponible</div>
                              )}
                              {categories.map((cat) => (
                                   <IonItemSliding key={cat.idcategorie} className="cs-sliding">
                                        <IonItem
                                             lines="none"
                                             className={`cs-ion-item ${cat.labelcategorie === value ? "cs-item-active" : ""}`}
                                             onClick={() => handleSelect(cat)}
                                        >
                                             <div className="cs-item">
                                                  <span className="cs-item-label">{cat.labelcategorie}</span>
                                                  {cat.labelcategorie === value && (
                                                       <IonIcon icon={checkmarkOutline} className="cs-item-check" />
                                                  )}
                                             </div>
                                        </IonItem>

                                        <IonItemOptions side="end" onIonSwipe={() => handleDelete(cat)}>
                                             <IonItemOption color="danger" expandable onClick={() => handleDelete(cat)}>
                                                  <IonIcon icon={trashOutline} slot="icon-only" />
                                             </IonItemOption>
                                        </IonItemOptions>
                                   </IonItemSliding>
                              ))}
                         </div>

                         {/* Footer */}
                         <div className="cs-footer">
                              {showCreateInput ? (
                                   <div className="cs-create-row">
                                        <input
                                             className="cs-create-input"
                                             placeholder="Nom de la catégorie..."
                                             value={newLabel}
                                             onChange={(e) => setNewLabel(e.target.value)}
                                             autoFocus
                                        />
                                        <button
                                             className="cs-confirm-btn"
                                             disabled={!newLabel.trim() || creating}
                                             onClick={handleCreate}
                                        >
                                             {creating ? "..." : "Créer"}
                                        </button>
                                        <button
                                             className="cs-cancel-btn"
                                             onClick={() => { setShowCreateInput(false); setNewLabel(""); }}
                                        >
                                             <IonIcon icon={close} />
                                        </button>
                                   </div>
                              ) : (
                                   <button className="cs-add-btn" onClick={() => setShowCreateInput(true)}>
                                        <IonIcon icon={addOutline} />
                                        <span>Nouvelle catégorie</span>
                                   </button>
                              )}
                         </div>

                    </div>
               </IonModal>
          </>
     );
};

export default CategorySelect;