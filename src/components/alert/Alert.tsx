import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Alert.css";

interface AlertProps {
     show: boolean;
     type?: 0 | 1; // 0 izy temporaire de 1 izy confirmation
     title?: string;
     message?: string;
     duration?: number;
     onCancel?: () => void;
     onConfirm?: () => void;
     onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({
     show, type = 1, title = "Confirmation", message = "Tu es sûr ?",
     duration = 3000, onCancel, onConfirm, onClose
}) => {
     useEffect(() => {
          if (show && type === 0) {
               const timer = setTimeout(onClose, duration);
               return () => clearTimeout(timer);
          }
     }, [show, type, duration, onClose]);

     if (!show) return null;

     return createPortal(
          <div className="alert-overlay">
               <div className={`alert-modal ${type === 0 ? 'danger' : ''}`}>                    <h3>{title}</h3>
                    <p className="m-0">{message}</p>

                    {type === 1 && (
                         <div className="alert-actions row g-0">
                              <button className="btn cancel col" onClick={onCancel}>
                                   Annuler
                              </button>
                              <button className="btn confirm col" onClick={onConfirm}>
                                   Confirmer
                              </button>
                         </div>
                    )}
               </div>
          </div>,
          document.body
     );
};

export default Alert;