import React, { useEffect, useState, useRef } from 'react';
import {
	IonButtons,
	IonContent,
	IonHeader,
	IonMenuButton,
	IonPage,
	IonTitle,
	IonToolbar,
	IonText,
	IonLoading,
	IonButton
} from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { Geolocation } from '@capacitor/geolocation';
import 'ol/ol.css';
import './Tab2.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Point, Polygon } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

const SERVER_URL_KEY = 'server_url';
const GEOSERVER_PORT = 8080;

interface WMSLayerConfig {
	name: string;
	style?: string;
	filter?: string;
	visible?: boolean;
}

const Tab2: React.FC = () => {
	const [serverUrl, setServerUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isTracking, setIsTracking] = useState(false);
	const [gpsPoints, setGpsPoints] = useState<Feature[]>([]);
	const [polygonPoints, setPolygonPoints] = useState<Feature[]>([]);
	const [drawingMode, setDrawingMode] = useState(false);
	const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
	const [hasZoomed, setHasZoomed] = useState(false);


	const mapRef = useRef<Map | null>(null);
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const vectorSourceRef = useRef<VectorSource>(new VectorSource());
	const gpsSourceRef = useRef<VectorSource>(new VectorSource());
	const positionFeatureRef = useRef<Feature | null>(null);

	const wmsLayersConfig: WMSLayerConfig[] = [
		{ name: 'E-topo:Fianarantsoa', visible: true },
		{ name: 'E-topo:cadastre', visible: true }
	];

	// Styles
	const pointStyle = new Style({
		image: new CircleStyle({
			radius: 6,
			fill: new Fill({ color: 'red' }),
			stroke: new Stroke({ color: 'white', width: 2 })
		})
	});

	const positionStyle = new Style({
		image: new CircleStyle({
			radius: 8,
			fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
			stroke: new Stroke({ color: 'white', width: 3 })
		})
	});

	const polygonStyle = new Style({
		fill: new Fill({ color: 'rgba(0, 255, 0, 0.2)' }),
		stroke: new Stroke({ color: 'green', width: 2 })
	});

	// GPS Tracking
	useEffect(() => {
		let watchId: string;

		const startTracking = async () => {
			try {
				positionFeatureRef.current = new Feature();
				positionFeatureRef.current.setStyle(positionStyle);
				gpsSourceRef.current.addFeature(positionFeatureRef.current);

				watchId = await Geolocation.watchPosition({
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0
				}, (position) => {
					if (!position) return;

					const coord = fromLonLat([position.coords.longitude, position.coords.latitude]) as [number, number];
					setCurrentPosition(() => coord); // bien taper pour éviter l’erreur TS

					if (positionFeatureRef.current) {
						positionFeatureRef.current.setGeometry(new Point(coord));
					}

					if (mapRef.current) {
						const view = mapRef.current.getView();
						view.setCenter(coord);

						if (!hasZoomed) {
							view.setZoom(16);
							setHasZoomed(true);
						}
					}
				});
			} catch (err) {
				console.error('GPS error:', err);
				setError('Erreur GPS');
			}
		};

		if (isTracking) {
			startTracking();
		} else {
			if (positionFeatureRef.current) {
				gpsSourceRef.current.removeFeature(positionFeatureRef.current);
				positionFeatureRef.current = null;
			}
			setCurrentPosition(null);
		}

		return () => {
			if (watchId) Geolocation.clearWatch({ id: watchId });
		};
	}, [isTracking, hasZoomed]);

	// Drawing Mode
	useEffect(() => {
		if (!mapRef.current || !drawingMode) return;

		const map = mapRef.current;

		const handleClick = (evt: any) => {
			const coord = evt.coordinate;
			const point = new Point(coord);
			const feature = new Feature(point);
			feature.setStyle(pointStyle);

			setPolygonPoints(prev => [...prev, feature]);
			vectorSourceRef.current.addFeature(feature);

			if (polygonPoints.length >= 2) {
				const coordinates = polygonPoints.map(f => {
					const geom = f.getGeometry();
					if (geom instanceof Point) {
						return geom.getCoordinates();
					}
					return [0, 0];
				});
				coordinates.push(coord);

				if (polygonPoints.length >= 3) {
					const firstGeom = polygonPoints[0]?.getGeometry();
					if (firstGeom instanceof Point) {
						coordinates.push(firstGeom.getCoordinates());
					}
				}

				vectorSourceRef.current.forEachFeature(f => {
					if (f.getGeometry() instanceof Polygon) {
						vectorSourceRef.current.removeFeature(f);
					}
				});

				const polygon = new Polygon([coordinates]);
				const polygonFeature = new Feature(polygon);
				polygonFeature.setStyle(polygonStyle);
				vectorSourceRef.current.addFeature(polygonFeature);
			}
		};

		map.on('click', handleClick);

		return () => {
			map.un('click', handleClick);
		};
	}, [drawingMode, polygonPoints]);

	// Map Initialization
	const initializeMap = (baseUrl: string) => {
		if (!mapContainerRef.current) return;

		try {
			const wmsLayers = wmsLayersConfig.map(config => (
				new TileLayer({
					visible: config.visible,
					source: new TileWMS({
						url: `${baseUrl}/geoserver/E-topo/wms`,
						params: {
							'LAYERS': config.name,
							'TILED': true,
							'FORMAT': 'image/png',
							'TRANSPARENT': true,
							'VERSION': '1.1.1',
							'STYLES': config.style || '',
							'CQL_FILTER': config.filter || ''
						},
						serverType: 'geoserver',
						crossOrigin: 'anonymous'
					})
				})
			));

			// Vector layers
			const vectorLayer = new VectorLayer({
				source: vectorSourceRef.current,
				style: polygonStyle
			});

			const gpsLayer = new VectorLayer({
				source: gpsSourceRef.current
			});

			const map = new Map({
				target: mapContainerRef.current,
				layers: [
					new TileLayer({ source: new OSM() }),
					...wmsLayers,
					vectorLayer,
					gpsLayer
				],
				view: new View({
					center: fromLonLat([47.486, -18.921]),
					zoom: 11,
					minZoom: 10,
					maxZoom: 30
				})
			});

			mapRef.current = map;

			// Fallback timeout
			const timeout = setTimeout(() => {
				setLoading(false);
			}, 5000);

			map.once('rendercomplete', () => {
				clearTimeout(timeout);
				setLoading(false);
			});

		} catch (err) {
			console.error("Map init error:", err);
			setLoading(false);
			setError("Erreur d'initialisation");
		}
	};

	// Load server URL
	useEffect(() => {
		const loadServerUrl = async () => {
			try {
				const result = await Preferences.get({ key: SERVER_URL_KEY });
				if (result.value) {
					const url = new URL(result.value);
					const baseUrl = `http://${url.hostname}:${GEOSERVER_PORT}`;
					setServerUrl(baseUrl);
					initializeMap(baseUrl);
				} else {
					setError("Aucune URL de serveur configurée");
					setLoading(false);
				}
			} catch (err) {
				console.error("Erreur de chargement de l'URL:", err);
				setError("Format d'URL invalide");
				setLoading(false);
			}
		};

		loadServerUrl();

		return () => {
			if (mapRef.current) {
				mapRef.current.setTarget(undefined);
				mapRef.current = null;
			}
		};
	}, []);

	// GPS Point Capture
	const captureGpsPoint = async () => {
		try {
			if (!currentPosition) return;

			const point = new Point(currentPosition);
			const feature = new Feature(point);
			feature.setStyle(pointStyle);

			setGpsPoints(prev => [...prev, feature]);
			vectorSourceRef.current.addFeature(feature);

		} catch (err) {
			console.error('GPS capture error:', err);
			setError('Erreur de capture GPS');
		}
	};

	// Export GPS Points
	const exportGpsPoints = () => {
		const coords = gpsPoints.map(feature => {
			const geom = feature.getGeometry();
			if (geom instanceof Point) {
				return geom.getCoordinates();
			}
			return [0, 0];
		});

		console.log('Points GPS collectés:', coords);
		alert(`${coords.length} points exportés vers la console`);
	};

	// Reset Drawing
	const resetDrawing = () => {
		vectorSourceRef.current.clear();
		setPolygonPoints([]);
	};

	// Complete Polygon
	const completePolygon = () => {
		if (polygonPoints.length < 3) {
			setError('Au moins 3 points requis pour un polygone');
			return;
		}

		const coordinates = polygonPoints.map(f => {
			const geom = f.getGeometry();
			if (geom instanceof Point) {
				return geom.getCoordinates();
			}
			return [0, 0];
		});

		const firstGeom = polygonPoints[0]?.getGeometry();
		if (firstGeom instanceof Point) {
			coordinates.push(firstGeom.getCoordinates());
		}

		vectorSourceRef.current.clear();
		const polygon = new Polygon([coordinates]);
		const polygonFeature = new Feature(polygon);
		polygonFeature.setStyle(polygonStyle);
		vectorSourceRef.current.addFeature(polygonFeature);

		setDrawingMode(false);
		setPolygonPoints([]);

		console.log('Polygone final:', coordinates);
		alert('Polygone enregistré!');
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonMenuButton />
					</IonButtons>
					<IonTitle>Repérage PLOF</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Repérage PLOF</IonTitle>
					</IonToolbar>
				</IonHeader>

				{error && (
					<IonText color="danger" className="ion-padding">
						{error}
					</IonText>
				)}

				{!serverUrl && !error && (
					<IonText color="warning" className="ion-padding">
						Chargement de la configuration...
					</IonText>
				)}

				<div
					ref={mapContainerRef}
					id="map"
					style={{
						width: '100%',
						height: '100%',
						opacity: loading ? 0 : 1,
						transition: 'opacity 0.3s ease'
					}}
				/>

				<div className="map-controls">
					{/* GPS Controls */}
					<IonButton
						onClick={() => {
							setIsTracking(!isTracking);
							setDrawingMode(false);
						}}
						color={isTracking ? 'danger' : 'primary'}
						className="control-button"
					>
						{isTracking ? 'Arrêter GPS' : 'Démarrer GPS'}
					</IonButton>

					{isTracking && (
						<IonButton
							onClick={captureGpsPoint}
							color="success"
							className="control-button"
						>
							Capturer Point
						</IonButton>
					)}

					{gpsPoints.length > 0 && (
						<IonButton
							onClick={exportGpsPoints}
							color="warning"
							className="control-button"
						>
							Exporter ({gpsPoints.length})
						</IonButton>
					)}

					{/* Drawing Controls */}
					<IonButton
						onClick={() => {
							setDrawingMode(!drawingMode);
							setIsTracking(false);
						}}
						color={drawingMode ? 'danger' : 'secondary'}
						className="control-button"
					>
						{drawingMode ? 'Annuler' : 'Dessiner'}
					</IonButton>

					{drawingMode && polygonPoints.length > 0 && (
						<>
							<IonButton
								onClick={resetDrawing}
								color="medium"
								className="control-button"
							>
								Effacer
							</IonButton>

							{polygonPoints.length >= 3 && (
								<IonButton
									onClick={completePolygon}
									color="success"
									className="control-button"
								>
									Terminer
								</IonButton>
							)}
						</>
					)}
				</div>

				<IonLoading
					isOpen={loading}
					message={serverUrl ? "Chargement de la carte..." : "Configuration requise"}
				/>
			</IonContent>
		</IonPage>
	);
};

export default Tab2;