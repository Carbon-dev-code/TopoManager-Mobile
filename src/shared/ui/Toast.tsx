import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IonIcon } from "@ionic/react";
import { close } from "ionicons/icons";

import "./Toast.css";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  visible: boolean;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};
const LABELS: Record<ToastType, string> = {
  success: "Succès",
  error: "Erreur",
  warning: "Attention",
  info: "Info",
};

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 3500,
  onClose,
  visible,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!visible) return;
    timerRef.current = setTimeout(() => {
      onClose();
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const toastContent = (
    <div className={`toast toast--${type}`} role="alert">
      <div className="toast__icon">
        <span>{ICONS[type]}</span>
      </div>

      <div className="toast__body">
        <span className="toast__label">{LABELS[type]}</span>
        <span className="toast__message">{message}</span>
      </div>

      <button className="toast__close" onClick={onClose} aria-label="Fermer">
        <IonIcon icon={close} />
      </button>
    </div>
  );
  return createPortal(toastContent, document.body);
};

export default Toast;

