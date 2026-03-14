import React, { useEffect, useRef, useState } from "react";
import { IonFab, IonFabButton, IonIcon } from "@ionic/react";
import { chevronUpOutline } from "ionicons/icons";
import "./ScrollToTop.css";

interface ScrollToTopProps {
  contentRef: React.RefObject<HTMLIonContentElement | null>;
  scrollContainerClass?: string;
}

interface ScrollableElement extends HTMLElement {
  __scrollHandler?: EventListener;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  scrollContainerClass = "parcelle-scroll",
}) => {
  const [visible, setVisible] = useState(false);
  const scrollElRef = useRef<ScrollableElement | null>(null);
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const attach = () => {
      const el = document.querySelector(
        `.${scrollContainerClass}`,
      ) as ScrollableElement;
      if (!el) return false;

      scrollElRef.current = el;
      const handleScroll = () => setVisible(el.scrollTop > 200);
      el.addEventListener("scroll", handleScroll);
      el.__scrollHandler = handleScroll;
      return true;
    };

    if (!attach()) {
      retryRef.current = setInterval(() => {
        if (attach() && retryRef.current) {
          clearInterval(retryRef.current);
        }
      }, 300);
    }

    return () => {
      if (retryRef.current) clearInterval(retryRef.current);
      const el = scrollElRef.current;
      if (el?.__scrollHandler) {
        el.removeEventListener("scroll", el.__scrollHandler);
      }
    };
  }, [scrollContainerClass]);

  const scrollToTop = () => {
    scrollElRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <IonFab
      vertical="bottom"
      horizontal="end"
      slot="fixed"
      className="scroll-to-top-fab"
    >
      <IonFabButton size="small" onClick={scrollToTop}>
        <IonIcon icon={chevronUpOutline} />
      </IonFabButton>
    </IonFab>
  );
};

export default ScrollToTop;

