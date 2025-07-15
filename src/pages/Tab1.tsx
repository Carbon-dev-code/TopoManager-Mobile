import React, { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonModal,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonAlert,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonTextarea,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonDatetime,
  IonRadioGroup,
  IonRadio
} from '@ionic/react';
import {
  trash,
  add,
  close,
  informationCircle,
  person,
  business,
  male,
  female,
  idCard,
  create
} from 'ionicons/icons';
import '../assets/dist/css/bootstrap.min.css';

// Interfaces
interface CIN {
  numero: string[];
  date: string;
  lieu: string;
}

interface ActeNaissance {
  numero: string;
  date: string;
  lieu: string;
}

interface Demandeur {
  id: string;
  type: 'physique' | 'morale';
  nom?: string;
  prenom?: string;
  neVers?: boolean;
  dateNaissance?: string;
  lieuNaissance?: string;
  sexe?: string;
  adresse?: string;
  nomPere?: string;
  nomMere?: string;
  situation?: string;
  nomConjoint?: string;
  piece?: 'cin' | 'acte' | 'rien';
  cin?: CIN;
  acte?: ActeNaissance;
  denomination?: string;
  typeMorale?: string;
  dateCreation?: string;
  siege?: string;
  observations?: string;
}

interface Parcelle {
  id: string;
  code: string;
  demandeurs: Demandeur[];
}

interface TempParcelle {
  code: string;
  demandeurs: Demandeur[];
}

const Tab1: React.FC = () => {
  // États principaux
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [tempParcelle, setTempParcelle] = useState<TempParcelle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDemandeurModal, setShowDemandeurModal] = useState(false);
  const [currentParcelleCode, setCurrentParcelleCode] = useState('');

  // États du formulaire demandeur
  const [isPhysique, setIsPhysique] = useState(true);
  const [formData, setFormData] = useState<Partial<Demandeur>>({
    neVers: false,
    sexe: '',
    situation: '',
    piece: undefined,
    cin: { numero: ['', '', '', ''], date: '', lieu: '' },
    acte: { numero: '', date: '', lieu: '' }
  });

  // Alertes
  const [showDeleteAlert, setShowDeleteAlert] = useState({
    show: false,
    parcelleId: '',
    demandeurId: ''
  });

  // Charger/Sauvegarder les données
  useEffect(() => {
    const load = async () => {
      const savedParcelles = await loadParcellesFromStorage();
      setParcelles(savedParcelles);
    };
    load();
  }, []);

  useEffect(() => {
    saveParcellesToStorage(parcelles);
  }, [parcelles]);


  // Gestion des parcelles
  const createParcelle = () => {
    if (!tempParcelle || !tempParcelle.code) return;

    const newParcelle: Parcelle = {
      id: Date.now().toString(),
      code: tempParcelle.code,
      demandeurs: tempParcelle.demandeurs.map(d => ({
        ...d,
        // Nettoyage des données avant sauvegarde
        cin: d.piece === 'cin' ? d.cin : undefined,
        acte: d.piece === 'acte' ? d.acte : undefined
      }))
    };

    setParcelles([...parcelles, newParcelle]);
    setTempParcelle(null);
    setShowCreateModal(false);
  };

  const removeParcelle = (id: string) => {
    setParcelles(parcelles.filter(p => p.id !== id));
  };

  const STORAGE_KEY = 'parcelles_data';
  const saveParcellesToStorage = async (parcelles: Parcelle[]) => {
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(parcelles)
    });
  };

  const loadParcellesFromStorage = async (): Promise<Parcelle[]> => {
    const result = await Preferences.get({ key: STORAGE_KEY });
    if (result.value) {
      try {
        const parsed = JSON.parse(result.value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.error("Erreur parsing JSON:", error);
      }
    }
    return [];
  };

  // Gestion des demandeurs
  const addDemandeur = () => {
    if (!tempParcelle) return;

    // Validation des champs obligatoires
    if (isPhysique) {
      if (!formData.nom || !formData.prenom || !formData.dateNaissance) {
        alert('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Date de naissance)');
        return;
      }
    } else {
      if (!formData.denomination) {
        alert('Veuillez saisir la dénomination');
        return;
      }
    }

    const newDemandeur: Demandeur = {
      id: Date.now().toString(),
      type: isPhysique ? 'physique' : 'morale',
      ...formData,
      // Nettoyage des données selon le type de pièce
      cin: formData.piece === 'cin' ? formData.cin : undefined,
      acte: formData.piece === 'acte' ? formData.acte : undefined
    };

    setTempParcelle({
      ...tempParcelle,
      demandeurs: [...tempParcelle.demandeurs, newDemandeur]
    });

    resetForm();
    setShowDemandeurModal(false);
  };

  const removeDemandeur = () => {
    const { parcelleId, demandeurId } = showDeleteAlert;
    setParcelles(parcelles.map(p => {
      if (p.id === parcelleId) {
        return { ...p, demandeurs: p.demandeurs.filter(d => d.id !== demandeurId) };
      }
      return p;
    }));
    setShowDeleteAlert({ show: false, parcelleId: '', demandeurId: '' });
  };

  // Helpers
  const resetForm = () => {
    setFormData({
      neVers: false,
      sexe: '',
      situation: '',
      piece: undefined,
      cin: { numero: ['', '', '', ''], date: '', lieu: '' },
      acte: { numero: '', date: '', lieu: '' },
      nomConjoint: ''
    });
    setIsPhysique(true);
  };

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNestedChange = (field: 'cin' | 'acte', key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value
      }
    }));
  };

  const handleCinNumberChange = (index: number, value: string) => {
    setFormData(prev => {
      const currentCin = prev.cin || { numero: ['', '', '', ''], date: '', lieu: '' };
      const newNumero = [...currentCin.numero];
      newNumero[index] = value;

      return {
        ...prev,
        cin: {
          ...currentCin,
          numero: newNumero
        }
      };
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Gestion Parcelles</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowCreateModal(true)}>
              <IonIcon icon={create} slot="start" />
              Ajouter
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Liste des parcelles */}
        {parcelles.length === 0 ? (
          <div className="text-center py-5">
            <IonIcon icon={informationCircle} size="large" className="text-muted mb-3" />
            <h4 className="text-muted">Aucune parcelle enregistrée</h4>
            <IonButton onClick={() => setShowCreateModal(true)}>
              Créer une première parcelle
            </IonButton>
          </div>
        ) : (
          <div className="parcelle-list">
            {parcelles.map(parcelle => (
              <IonCard key={parcelle.id} className="mb-3">
                <IonCardHeader className="d-flex justify-content-between align-items-center">
                  <div>
                    <IonLabel><strong>Parcelle:</strong> {parcelle.code}</IonLabel>
                    <IonBadge color="primary" className="ms-2">
                      {parcelle.demandeurs.length} demandeur(s)
                    </IonBadge>
                  </div>
                  <IonButton
                    fill="clear"
                    color="danger"
                    onClick={() => removeParcelle(parcelle.id)}
                  >
                    <IonIcon icon={trash} />
                  </IonButton>
                </IonCardHeader>

                <IonCardContent>
                  {parcelle.demandeurs.length === 0 ? (
                    <p className="text-muted">Aucun demandeur pour cette parcelle</p>
                  ) : (
                    <IonList>
                      {parcelle.demandeurs.map(demandeur => (
                        <IonItem key={demandeur.id}>
                          <IonIcon
                            slot="start"
                            icon={demandeur.type === 'physique' ? person : business}
                          />
                          <IonLabel>
                            {demandeur.type === 'physique'
                              ? `${demandeur.nom} ${demandeur.prenom}`
                              : demandeur.denomination}
                          </IonLabel>
                          <IonButton
                            fill="clear"
                            color="danger"
                            onClick={() => setShowDeleteAlert({
                              show: true,
                              parcelleId: parcelle.id,
                              demandeurId: demandeur.id
                            })}
                          >
                            <IonIcon icon={trash} />
                          </IonButton>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}

        {/* Modal: Création de parcelle */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => {
          setTempParcelle(null);
          setShowCreateModal(false);
        }}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonButton onClick={() => {
                  setTempParcelle(null);
                  setShowCreateModal(false);
                }}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>{tempParcelle ? 'Ajouter des demandeurs' : 'Nouvelle Parcelle'}</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {!tempParcelle ? (
              <IonCard>
                <IonCardContent>
                  <IonInput
                    label="Code Parcelle"
                    labelPlacement="floating"
                    placeholder="Ex: 123-045-789"
                    value={currentParcelleCode}
                    onIonChange={e => setCurrentParcelleCode(e.detail.value || '')}
                    className="mb-3"
                  />

                  <IonButton
                    expand="block"
                    onClick={() => {
                      if (currentParcelleCode) {
                        setTempParcelle({
                          code: currentParcelleCode,
                          demandeurs: []
                        });
                        setCurrentParcelleCode('');
                        setShowDemandeurModal(true);
                      }
                    }}
                    disabled={!currentParcelleCode}
                  >
                    <IonIcon icon={add} slot="start" />
                    Continuer pour ajouter des demandeurs
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ) : (
              <>
                <IonCard>
                  <IonCardHeader>
                    <IonLabel>Parcelle: {tempParcelle.code}</IonLabel>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonButton
                      expand="block"
                      onClick={() => setShowDemandeurModal(true)}
                    >
                      <IonIcon icon={add} slot="start" />
                      Ajouter un demandeur
                    </IonButton>

                    {tempParcelle.demandeurs.length > 0 && (
                      <div className="mt-3">
                        <h5>Demandeurs ajoutés:</h5>
                        <IonList>
                          {tempParcelle.demandeurs.map(demandeur => (
                            <IonItem key={demandeur.id}>
                              <IonLabel>
                                {demandeur.type === 'physique'
                                  ? `${demandeur.nom} ${demandeur.prenom}`
                                  : demandeur.denomination}
                              </IonLabel>
                              <IonButton
                                fill="clear"
                                color="danger"
                                onClick={() => {
                                  setTempParcelle({
                                    ...tempParcelle,
                                    demandeurs: tempParcelle.demandeurs.filter(d => d.id !== demandeur.id)
                                  });
                                }}
                              >
                                <IonIcon icon={trash} />
                              </IonButton>
                            </IonItem>
                          ))}
                        </IonList>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>

                <IonButton
                  expand="block"
                  color="success"
                  onClick={createParcelle}
                  className="mt-3"
                  disabled={tempParcelle.demandeurs.length === 0}
                >
                  <IonIcon icon={create} slot="start" />
                  Créer la parcelle avec {tempParcelle.demandeurs.length} demandeur(s)
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        {/* Modal: Ajout de demandeur */}
        <IonModal isOpen={showDemandeurModal} onDidDismiss={() => {
          resetForm();
          setShowDemandeurModal(false);
        }}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonButton onClick={() => setShowDemandeurModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>Ajouter Demandeur</IonTitle>
              <IonButtons slot="end">
                <IonButton strong={true} onClick={addDemandeur}>
                  Ajouter
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <div className="mb-4">
              <IonLabel className="me-3">Type de Personne :</IonLabel>
              <IonRadioGroup
                value={isPhysique ? 'physique' : 'morale'}
                onIonChange={e => setIsPhysique(e.detail.value === 'physique')}
              >
                <IonItem>
                  <IonLabel>Physique</IonLabel>
                  <IonRadio slot="start" value="physique" />
                </IonItem>
                <IonItem>
                  <IonLabel>Morale</IonLabel>
                  <IonRadio slot="start" value="morale" />
                </IonItem>
              </IonRadioGroup>
            </div>

            {isPhysique ? (
              <>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <IonLabel position="stacked">Nom*</IonLabel>
                    <IonInput
                      className="form-control px-3"
                      value={formData.nom}
                      onIonChange={e => handleInputChange({ target: { name: 'nom', value: e.detail.value! } })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <IonLabel position="stacked">Prénom*</IonLabel>
                    <IonInput
                      className="form-control px-3"
                      value={formData.prenom}
                      onIonChange={e => handleInputChange({ target: { name: 'prenom', value: e.detail.value! } })}
                    />
                  </div>
                </div>

                <IonItem>
                  <IonCheckbox
                    slot="start"
                    checked={formData.neVers}
                    onIonChange={e => handleInputChange({ target: { name: 'neVers', type: 'checkbox', checked: e.detail.checked } })}
                  />
                  <IonLabel>Né vers (approximatif)</IonLabel>
                </IonItem>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <IonLabel position="stacked">Date de naissance*</IonLabel>
                    {formData.neVers ? (
                      <IonInput
                        type="number"
                        className="form-control px-3"
                        placeholder="Année (ex: 1985)"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.dateNaissance?.substring(0, 4) || ''}
                        onIonChange={e => {
                          const year = e.detail.value || '';
                          handleInputChange({
                            target: {
                              name: 'dateNaissance',
                              value: year.length === 4 ? `${year}-01-01` : ''
                            }
                          });
                        }}
                      />
                    ) : (
                      <IonInput
                        type="date"
                        className="form-control px-3"
                        value={formData.dateNaissance}
                        onIonChange={e => handleInputChange({ target: { name: 'dateNaissance', value: e.detail.value! } })}
                      />
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <IonLabel position="stacked">Lieu de naissance</IonLabel>
                    <IonInput
                      className="form-control px-3"
                      value={formData.lieuNaissance}
                      onIonChange={e => handleInputChange({ target: { name: 'lieuNaissance', value: e.detail.value! } })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <IonLabel>Sexe</IonLabel>
                  <IonRadioGroup
                    value={formData.sexe}
                    onIonChange={e => handleInputChange({ target: { name: 'sexe', value: e.detail.value } })}
                  >
                    <IonItem>
                      <IonLabel>
                        <IonIcon icon={male} className="me-1" />
                        Masculin
                      </IonLabel>
                      <IonRadio slot="start" value="Masculin" />
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <IonIcon icon={female} className="me-1" />
                        Féminin
                      </IonLabel>
                      <IonRadio slot="start" value="Feminin" />
                    </IonItem>
                  </IonRadioGroup>
                </div>

                <div className="mb-3">
                  <IonLabel position="stacked">Adresse</IonLabel>
                  <IonInput
                    className="form-control px-3"
                    value={formData.adresse}
                    onIonChange={e => handleInputChange({ target: { name: 'adresse', value: e.detail.value! } })}
                  />
                </div>

                <h5 className="mt-4">Filiation</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <IonLabel position="stacked">Nom du père</IonLabel>
                    <IonInput
                      className="form-control px-3"
                      value={formData.nomPere}
                      onIonChange={e => handleInputChange({ target: { name: 'nomPere', value: e.detail.value! } })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <IonLabel position="stacked">Nom de la mère</IonLabel>
                    <IonInput
                      className="form-control px-3"
                      value={formData.nomMere}
                      onIonChange={e => handleInputChange({ target: { name: 'nomMere', value: e.detail.value! } })}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <IonLabel>Situation matrimoniale</IonLabel>
                    <IonRadioGroup
                      value={formData.situation}
                      onIonChange={e => handleInputChange({ target: { name: 'situation', value: e.detail.value } })}
                    >
                      <IonItem>
                        <IonLabel>Célibataire</IonLabel>
                        <IonRadio slot="start" value="celibataire" />
                      </IonItem>
                      <IonItem>
                        <IonLabel>Marié(e)</IonLabel>
                        <IonRadio slot="start" value="marie" />
                      </IonItem>
                      <IonItem>
                        <IonLabel>Veuf(ve)</IonLabel>
                        <IonRadio slot="start" value="veuf" />
                      </IonItem>
                    </IonRadioGroup>

                    {(formData.situation === 'marie' || formData.situation === 'veuf') && (
                      <div className="mt-2">
                        <IonLabel position="stacked">Nom du conjoint</IonLabel>
                        <IonInput
                          className="form-control px-3"
                          value={formData.nomConjoint}
                          onIonChange={e => handleInputChange({ target: { name: 'nomConjoint', value: e.detail.value! } })}
                          placeholder="Nom complet du conjoint"
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <IonLabel>Pièces d'identification</IonLabel>
                    <IonRadioGroup
                      value={formData.piece}
                      onIonChange={e => handleInputChange({ target: { name: 'piece', value: e.detail.value } })}
                    >
                      <IonItem>
                        <IonLabel>CIN</IonLabel>
                        <IonRadio slot="start" value="cin" />
                      </IonItem>
                      <IonItem>
                        <IonLabel>Acte de naissance</IonLabel>
                        <IonRadio slot="start" value="acte" />
                      </IonItem>
                      <IonItem>
                        <IonLabel>Rien</IonLabel>
                        <IonRadio slot="start" value="rien" />
                      </IonItem>
                    </IonRadioGroup>
                  </div>
                </div>

                {formData.piece === 'cin' && (
                  <>
                    <h5 className="mt-4">CIN</h5>
                    <div className="mb-3">
                      <IonLabel position="stacked">Numéro</IonLabel>
                      <div className="d-flex gap-2">
                        {[0, 1, 2, 3].map((index) => (
                          <IonInput
                            key={index}
                            className="form-control px-3"
                            style={{ width: '25%' }}
                            value={formData.cin?.numero?.[index] || ''}
                            onIonChange={e => handleCinNumberChange(index, e.detail.value!)}
                            maxlength={3}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <IonLabel position="stacked">Date</IonLabel>
                        <IonInput
                          type="date"
                          className="form-control px-3"
                          value={formData.cin?.date}
                          onIonChange={e => handleNestedChange('cin', 'date', e.detail.value!)}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <IonLabel position="stacked">Lieu</IonLabel>
                        <IonInput
                          className="form-control px-3"
                          value={formData.cin?.lieu}
                          onIonChange={e => handleNestedChange('cin', 'lieu', e.detail.value!)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.piece === 'acte' && (
                  <>
                    <h5 className="mt-4">Acte de naissance</h5>
                    <div className="mb-3">
                      <IonLabel position="stacked">Numéro</IonLabel>
                      <IonInput
                        className="form-control px-3"
                        value={formData.acte?.numero}
                        onIonChange={e => handleNestedChange('acte', 'numero', e.detail.value!)}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <IonLabel position="stacked">Date</IonLabel>
                        <IonInput
                          type="date"
                          className="form-control px-3"
                          value={formData.acte?.date}
                          onIonChange={e => handleNestedChange('acte', 'date', e.detail.value!)}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <IonLabel position="stacked">Lieu</IonLabel>
                        <IonInput
                          className="form-control px-3"
                          value={formData.acte?.lieu}
                          onIonChange={e => handleNestedChange('acte', 'lieu', e.detail.value!)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="row mb-3">
                  <div className="col-md-8">
                    <IonLabel position="stacked">Type*</IonLabel>
                    <IonSelect
                      className="form-select"
                      value={formData.typeMorale}
                      onIonChange={e => handleInputChange({ target: { name: 'typeMorale', value: e.detail.value } })}
                    >
                      <IonSelectOption value="Société">Société</IonSelectOption>
                      <IonSelectOption value="Association">Association</IonSelectOption>
                      <IonSelectOption value="ONG">ONG</IonSelectOption>
                      <IonSelectOption value="Institution">Institution</IonSelectOption>
                    </IonSelect>
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <IonButton expand="block" fill="outline">
                      <IonIcon icon={informationCircle} slot="start" />
                      Liste
                    </IonButton>
                  </div>
                </div>

                <div className="mb-3">
                  <IonLabel position="stacked">Dénomination*</IonLabel>
                  <IonInput
                    className="form-control px-3"
                    placeholder="Ex: Topomanager SARL"
                    value={formData.denomination}
                    onIonChange={e => handleInputChange({ target: { name: 'denomination', value: e.detail.value! } })}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <IonLabel position="stacked">Date de création</IonLabel>
                    <IonInput
                      type="date"
                      className="form-control px-3"
                      value={formData.dateCreation}
                      onIonChange={e => handleInputChange({ target: { name: 'dateCreation', value: e.detail.value! } })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <IonLabel position="stacked">Siège</IonLabel>
                    <IonInput
                      className="form-control px-3"
                      placeholder="Adresse du siège social"
                      value={formData.siege}
                      onIonChange={e => handleInputChange({ target: { name: 'siege', value: e.detail.value! } })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <IonLabel position="stacked">Observations</IonLabel>
                  <IonTextarea
                    className="form-control px-3"
                    rows={4}
                    placeholder="Saisir des remarques ou notes..."
                    value={formData.observations}
                    onIonChange={e => handleInputChange({ target: { name: 'observations', value: e.detail.value! } })}
                  />
                </div>
              </>
            )}
          </IonContent>
        </IonModal>

        {/* Alerte suppression */}
        <IonAlert
          isOpen={showDeleteAlert.show}
          onDidDismiss={() => setShowDeleteAlert({ show: false, parcelleId: '', demandeurId: '' })}
          header="Confirmer suppression"
          message="Êtes-vous sûr de vouloir supprimer ce demandeur ?"
          buttons={[
            { text: 'Annuler', role: 'cancel' },
            { text: 'Supprimer', handler: removeDemandeur }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;