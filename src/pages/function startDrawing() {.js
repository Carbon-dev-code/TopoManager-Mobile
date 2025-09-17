function startDrawing() {
    if (!mapRef.current) return;

    // --- Source et couche pour les dessins utilisateur ---
    const drawSource = new VectorSource();
    const drawLayer = new VectorLayer({
      source: drawSource,
      style: styleByType, // Ton style global
    });
    drawLayer.setZIndex(9999);
    mapRef.current.addLayer(drawLayer);

    // --- Interaction Draw Polygon ---
    const drawInteraction = new Draw({
      source: drawSource,
      type: "Polygon",
    });

    // --- Interaction Modify ---
    const modifyInteraction = new Modify({
      source: drawSource,
    });

    // --- Ajout interactions ---
    mapRef.current.addInteraction(drawInteraction);
    mapRef.current.addInteraction(modifyInteraction);

    // --- Snap sur la couche utilisateur ---
    mapRef.current.addInteraction(new Snap({ source: drawSource }));

    // --- Snap sur les parcelles ---
    if (parcellesSourceRef.current) {
      mapRef.current.addInteraction(
        new Snap({ source: parcellesSourceRef.current })
      );
    }

    // --- Snap sur les couches GeoJSON dynamiques ---
    Object.values(geoJsonLayersRef.current).forEach((layer) => {
      const src = layer.getSource();
      if (src) {
        mapRef.current.addInteraction(new Snap({ source: src }));
      }
    });

    // --- Callback quand un polygone est terminé ---
    drawInteraction.on("drawend", (event) => {
      const feature = event.feature;

      // Ajout d’attributs pour matcher ton styleByType
      feature.set("name", "parcelle");
      feature.set("code", currentParcelle?.code ?? "");

      // Forcer redraw si besoin
      feature.changed();

      console.log(feature);
      console.log(currentParcelle);
      
      

      const geometry = feature.getGeometry();
      console.log("Polygon drawn:", geometry.getCoordinates());
    });
  }