import React, { useEffect, useState } from "react";
import { IonFab, IonFabButton, IonIcon } from "@ionic/react";
import { chevronUpOutline } from "ionicons/icons";
import "./ScrollToTop.css";

interface ScrollToTopProps {
  contentRef: React.RefObject<HTMLIonContentElement | null>;
  scrollContainerClass?: string;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  scrollContainerClass = "parcelle-scroll",
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollEl = document.querySelector(
      `.${scrollContainerClass}`,
    ) as HTMLElement;
    if (!scrollEl) return;

    const handleScroll = () => setVisible(scrollEl.scrollTop > 200);
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [scrollContainerClass]);

  const scrollToTop = () => {
    const scrollEl = document.querySelector(
      `.${scrollContainerClass}`,
    ) as HTMLElement;
    scrollEl?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <IonFab vertical="bottom" horizontal="end" slot="fixed" className="scroll-to-top-fab">
      <IonFabButton size="small" onClick={scrollToTop}>
        <IonIcon icon={chevronUpOutline} />
      </IonFabButton>
    </IonFab>
  );
};

export default ScrollToTop;
