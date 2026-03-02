import { IonPopover, IonList, IonItem, IonLabel, IonIcon } from '@ionic/react';
import "./DropDown.css";
import { layersOutline, pencilOutline, readerOutline, trashOutline } from 'ionicons/icons';

interface DropDownProps {
     show: boolean;
     onClose: () => void;
     onView?: () => void;   // 👈 Détails
     onEdit?: () => void;   // 👈 Modifier
     onDelete?: () => void;
     onCroquis?: () => void;
     triggerId: string;
}


const DropDown: React.FC<DropDownProps> = ({
     show,
     onClose,
     onView,
     onEdit,
     onDelete,
     onCroquis,
     triggerId,
}) => {
     return (
          <IonPopover
               trigger={triggerId}
               isOpen={show}
               onDidDismiss={onClose}
               side="bottom"
               alignment="end"
               className="custom-popover"
          >
               <IonList lines="none" className="dropdown-list">
                    <IonItem
                         button
                         detail={false}
                         onClick={(e) => {
                              e.stopPropagation();
                              onCroquis?.();
                         }}
                    >
                         <IonIcon icon={layersOutline} color='black' className='fs-4 me-2' />
                         <IonLabel>Croquis</IonLabel>
                    </IonItem>

                    <div className="bar" />

                    <IonItem
                         button
                         detail={false}
                         onClick={(e) => {
                              e.stopPropagation();
                              onView?.();
                         }}
                    >
                         <IonIcon icon={readerOutline} className="fs-4 me-2" />
                         <IonLabel>Détails</IonLabel>
                    </IonItem>


                    <IonItem
                         button
                         detail={false}
                         onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.();
                         }}
                    >
                         <IonIcon icon={pencilOutline} className="fs-4 me-2" />
                         <IonLabel>Modifier</IonLabel>
                    </IonItem>


                    <IonItem
                         button
                         detail={false}
                         onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.();
                         }}
                         className="danger-item"
                    >
                         <IonIcon icon={trashOutline} color="danger" className="fs-4 me-2" />
                         <IonLabel>Supprimer</IonLabel>
                    </IonItem>
               </IonList>
          </IonPopover>
     );
};

export default DropDown;