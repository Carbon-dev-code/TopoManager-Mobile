import { IonPopover, IonList, IonItem, IonLabel, IonIcon } from "@ionic/react";
import "./DropDown.css";
import {
  layersOutline,
  pencilOutline,
  readerOutline,
  trashOutline,
} from "ionicons/icons";

interface DropDownProps {
  show: boolean;
  onClose: () => void;
  onView?: () => void;
  onEdit?: () => void;
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
      className="dropdown-popover"
    >
      <IonList lines="none" className="dd-list">
        <IonItem
          button
          detail={false}
          className="dd-item"
          onClick={(e) => {
            e.stopPropagation();
            onCroquis?.();
            onClose();
          }}
        >
          <div className="dd-icon-wrap dd-icon-teal">
            <IonIcon icon={layersOutline} />
          </div>
          <IonLabel>
            <span className="dd-label">Croquis</span>
            <span className="dd-sub">Voir le plan de la parcelle</span>
          </IonLabel>
        </IonItem>

        <div className="dd-divider" />

        <IonItem
          button
          detail={false}
          className="dd-item"
          onClick={(e) => {
            e.stopPropagation();
            onView?.();
            onClose();
          }}
        >
          <div className="dd-icon-wrap dd-icon-blue">
            <IonIcon icon={readerOutline} />
          </div>
          <IonLabel>
            <span className="dd-label">Détails</span>
            <span className="dd-sub">Voir la fiche complète</span>
          </IonLabel>
        </IonItem>

        <div className="dd-divider" />

        <IonItem
          button
          detail={false}
          className="dd-item"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
            onClose();
          }}
        >
          <div className="dd-icon-wrap dd-icon-indigo">
            <IonIcon icon={pencilOutline} />
          </div>
          <IonLabel>
            <span className="dd-label">Modifier</span>
            <span className="dd-sub">Éditer les informations</span>
          </IonLabel>
        </IonItem>

        <div className="dd-divider" />

        <IonItem
          button
          detail={false}
          className="dd-item dd-item-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
            onClose();
          }}
        >
          <div className="dd-icon-wrap dd-icon-red">
            <IonIcon icon={trashOutline} />
          </div>
          <IonLabel>
            <span className="dd-label">Supprimer</span>
            <span className="dd-sub">Action irréversible</span>
          </IonLabel>
        </IonItem>
      </IonList>
    </IonPopover>
  );
};

export default DropDown;

