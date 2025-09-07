import React from "react";
import {
    IonList, IonItem, IonSelect, IonSelectOption,
    IonInput, IonTextarea
} from "@ionic/react";

interface MoralProps {
    demandeur: any;
    setDemandeur: (value: any) => void;
    typeMoral: { id: string | number; labetypemoral: string }[];
}

const Moral: React.FC<MoralProps> = ({ demandeur, setDemandeur, typeMoral }) => {
    return (
        <IonList>
            <IonItem>
                <IonSelect
                    label="Type :"
                    value={demandeur.typeMorale}
                    onIonChange={(e) =>
                        setDemandeur({
                            ...demandeur,
                            typeMorale: e.detail.value!,
                        })
                    }
                >
                    {typeMoral.map((type, index) => (
                        <IonSelectOption key={`type-${index}`} value={type.id}>
                            {type.labetypemoral}
                        </IonSelectOption>
                    ))}
                </IonSelect>
            </IonItem>
            <IonItem>
                <IonInput
                    label="Dénomination :"
                    type="text"
                    value={demandeur.denomination}
                    onIonChange={(e) =>
                        setDemandeur({
                            ...demandeur,
                            denomination: e.detail.value!,
                        })
                    }
                    placeholder="Dénomination"
                ></IonInput>
            </IonItem>
            <IonItem>
                <IonInput
                    label="Date de création :"
                    type="date"
                    value={demandeur.dateCreation}
                    onIonChange={(e) =>
                        setDemandeur({
                            ...demandeur,
                            dateCreation: e.detail.value!,
                        })
                    }
                    placeholder="Date de creation"
                ></IonInput>
            </IonItem>
            <IonItem>
                <IonInput
                    label="Siège :"
                    type="text"
                    value={demandeur.siege}
                    onIonChange={(e) =>
                        setDemandeur({
                            ...demandeur,
                            siege: e.detail.value!,
                        })
                    }
                    placeholder="Siège"
                ></IonInput>
            </IonItem>
            <IonItem>
                <IonTextarea
                    label="Observations"
                    rows={4}
                    placeholder="Saisir des remarques ou notes..."
                    value={demandeur.observations}
                    onIonChange={(e) =>
                        setDemandeur({
                            ...demandeur,
                            observations: e.detail.value!,
                        })
                    }
                />
            </IonItem>
        </IonList>
    );
};

export default Moral;
