  useEffect(() => {
    if (!mapRef.current || !fabOpen) return;

    const map = mapRef.current;
    const view = map.getView();

    const snapToCenter = () => {
      const center = view.getCenter();
      if (!center) return;

      let closest: Coordinate | null = null;
      let minDist = Infinity;

      const sources = [
        drawSourceRef.current,
        parcellesSourceRef.current,
        ...Object.values(geoJsonLayersRef.current).map((l) => l.getSource()),
      ].filter(Boolean);

      sources.forEach((src: VectorSource) => {
        src.getFeatures().forEach((f) => {
          const geom = f.getGeometry();
          if (!geom) return;

          switch (geom.getType()) {
            case "Polygon":
              geom.getCoordinates()[0].forEach((v) => {
                const dist = Math.hypot(v[0] - center[0], v[1] - center[1]);
                if (dist < minDist) {
                  minDist = dist;
                  closest = v;
                }
              });
              break;
            case "LineString":
              const coords = geom.getCoordinates();
              for (let i = 0; i < coords.length - 1; i++) {
                const p = projectPointOnSegment(
                  center,
                  coords[i],
                  coords[i + 1]
                );
                const dist = Math.hypot(center[0] - p[0], center[1] - p[1]);
                if (dist < minDist) {
                  minDist = dist;
                  closest = p;
                }
              }
              break;
            case "Point":
              const v = geom.getCoordinates();
              const dist = Math.hypot(center[0] - v[0], center[1] - v[1]);
              if (dist < minDist) {
                minDist = dist;
                closest = v;
              }
              break;
          }
        });
      });

      if (closest) view.setCenter(closest);
    };

    const handleMove = () => snapToCenter();

    // On écoute tous les mouvements de la vue
    view.on("change:center", handleMove);

    return () => view.un("change:center", handleMove);
  }, [fabOpen]);