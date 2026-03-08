import React, { useEffect, useState } from "react";
import { IonFab, IonFabButton, IonIcon } from "@ionic/react";
import { chevronUpOutline } from "ionicons/icons";
import "./ScrollToTop.css";

interface ScrollToTopProps {
  contentRef: React.RefObject<HTMLIonContentElement | null>;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ contentRef }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    let scrollEl: HTMLElement | null = null;

    el.getScrollElement().then((se) => {
      scrollEl = se;
      const handleScroll = () => {
        setVisible(se.scrollTop > 180);
        console.log(se.scrollTop);
      };
      se.addEventListener("scroll", handleScroll);
    });

    return () => {
      scrollEl?.removeEventListener("scroll", () => {});
    };
  }, [contentRef]);

  const scrollToTop = () => {
    contentRef.current?.scrollToTop(400);
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