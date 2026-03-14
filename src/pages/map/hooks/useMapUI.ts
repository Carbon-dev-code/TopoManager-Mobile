import { useState } from "react";

export const useMapUI = () => {
  const [showCard, setShowCard] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  return {
    showCard,
    setShowCard,
    fabOpen,
    setFabOpen,
    showSearch,
    setShowSearch,
    showGPS,
    setShowGPS,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
  };
};
