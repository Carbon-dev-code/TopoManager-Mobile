import { createPortal } from "react-dom";
import { IonIcon } from "@ionic/react";
import "./DropDownBest.css";

interface DropDownProps {
  show: boolean;
  onClose: () => void;
  triggerId: string;
  children: React.ReactNode;
}

interface DropDownItemProps {
  icon: string;
  label: string;
  sub?: string;
  color?: "blue" | "teal" | "indigo" | "red" | "green";
  onClick: () => void;
}

export const DropDownItem: React.FC<DropDownItemProps> = ({
  icon, label, sub, color = "blue", onClick,
}) => (
  <>
    <div className="dd-best-item" onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <div className={`dd-best-icon-wrap dd-best-icon-${color}`}>
        <IonIcon icon={icon} />
      </div>
      <div className="dd-best-label-wrap">
        <span className="dd-best-label">{label}</span>
        {sub && <span className="dd-best-sub">{sub}</span>}
      </div>
    </div>
    <div className="dd-best-divider" />
  </>
);

const DropDown: React.FC<DropDownProps> = ({ show, onClose, triggerId, children }) => {
  if (!show) return null;

  const trigger = document.getElementById(triggerId);
  const rect = trigger?.getBoundingClientRect();
  const top = rect ? rect.bottom + 8 : 60;
  const right = rect ? window.innerWidth - rect.right : 8;

  return createPortal(
    <div className="dd-best-overlay" onClick={onClose}>
      <div className="dd-best-menu" style={{ top, right }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default DropDown;