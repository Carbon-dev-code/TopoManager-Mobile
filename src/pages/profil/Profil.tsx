import {
  IonButtons,
  IonContent,
  IonIcon,
  IonMenuButton,
  IonPage,
  useIonViewWillEnter,
} from "@ionic/react";
import "./Profil.css";
import {
  alertOutline,
  checkmarkCircleOutline,
  layersSharp,
  person,
} from "ionicons/icons";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  statisiqueParcelles,
  parcellesParJourSemaine,
} from "../../model/base/DbSchema";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Preferences } from "@capacitor/preferences";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const getLundi = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

const Profil: React.FC = () => {
  const isMounted = useRef(true);
  const chartRef = useRef<ChartJS<"bar">>(null);
  const [gradientColor, setGradientColor] = useState<string | CanvasGradient>(
    "#0054e9",
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [username, setUsername] = useState("");
  const [weekDataNumbers, setWeekDataNumbers] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0,
  ]);

  const [stats, setStats] = useState({
    totalParcelles: 0,
    parcellesSync: 0,
    parcellesErreur: 0,
    totalDemandeurs: 0,
  });

  const loadUser = async () => {
    const { value } = await Preferences.get({ key: "username" });
    if (value) setUsername(value);
  };

  const loadStats = useCallback(async () => {
    try {
      const data = await statisiqueParcelles();
      const weekData = await parcellesParJourSemaine(selectedDate);

      if (!isMounted.current) return;

      setStats({
        totalParcelles: data.parcellesCreeParUser ?? 0,
        parcellesSync: data.parcellesSyncParUser ?? 0,
        parcellesErreur: data.parcellesSyncErreur ?? 0,
        totalDemandeurs: data.demandeursTotalTablette ?? 0,
      });

      setWeekDataNumbers(weekData);
    } catch (error) {
      console.error("Erreur récupération statistiques ou semaine:", error);
    }
  }, [selectedDate]);

  useIonViewWillEnter(() => {
    isMounted.current = true;
    loadStats();
    loadUser();
  });

  useEffect(() => {
    loadStats();
  }, [selectedDate]);

  // Gradient sur les barres
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, "#0054e9");
    gradient.addColorStop(1, "rgba(0, 84, 233, 0.08)");
    setGradientColor(gradient);
  }, [weekDataNumbers]);

  const lundi = getLundi(selectedDate);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);

  const isCurrentWeek = getLundi(new Date()).getTime() === lundi.getTime();

  const goToPrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const weekData = {
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [
      {
        label: "Parcelles créées",
        data: weekDataNumbers,
        backgroundColor: gradientColor,
        borderRadius: 10,
        borderSkipped: false,
        barPercentage: 0.55,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f8fafc",
        bodyColor: "#94a3b8",
        padding: 12,
        cornerRadius: 10,
        titleFont: { size: 13, weight: "bold" },
        callbacks: {
          label: (ctx) => {
            const y = ctx.parsed.y ?? 0;
            return ` ${y} parcelle${y > 1 ? "s" : ""}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 12, weight: 500 },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148,163,184,0.08)",
        },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: "#94a3b8",
          stepSize: 1,
          font: { size: 11 },
        },
      },
    },
  };

  const syncRate =
    stats.totalParcelles > 0
      ? Math.round((stats.parcellesSync / stats.totalParcelles) * 100)
      : 0;

  return (
    <IonPage>
      <IonContent fullscreen>
        {/* HEADER */}
        <div className="top-header">
          <div className="top-header-left">
            <div>
              <div className="header-title">Profil</div>
              <div className="header-sub">Dashboard personnel</div>
            </div>
          </div>
          <div className="top-header-right">
            <IonButtons slot="end">
              <IonMenuButton />
            </IonButtons>
          </div>
        </div>

        <div className="profil-container">
          {/* PROFIL CARD */}
          <div className="profil-header">
            <div className="profil-avatar-icon">
              <IonIcon icon={person} />
            </div>
            <div className="profil-info">
              <h2>{username}</h2>
            </div>
            <div className="profil-badge">Actif</div>
          </div>

          {/* KPI GRID */}
          <div className="dashboard-grid">
            <div className="card card-blue">
              <span className="card-label">Parcelles</span>
              <div className="card-value">{stats.totalParcelles}</div>
              <div className="card-icon-bg">
                <IonIcon icon={layersSharp} />
              </div>
            </div>
            <div className="card card-indigo">
              <span className="card-label">Demandeurs</span>
              <div className="card-value">{stats.totalDemandeurs}</div>
              <div className="card-icon-bg">
                <IonIcon icon={person} />
              </div>
            </div>
            <div className="card card-green">
              <span className="card-label">Synchronisées</span>
              <div className="card-value">{stats.parcellesSync}</div>
              <div className="card-icon-bg">
                <IonIcon icon={checkmarkCircleOutline} />
              </div>
            </div>
            <div className="card card-red">
              <span className="card-label">Erreurs</span>
              <div className="card-value">{stats.parcellesErreur}</div>
              <div className="card-icon-bg">
                <IonIcon icon={alertOutline} />
              </div>
            </div>
          </div>

          {/* SYNC PROGRESS */}
          <div className="sync-bar-container">
            <div className="sync-bar-header">
              <span className="sync-bar-label">Taux de synchronisation</span>
              <span className="sync-bar-percent">{syncRate}%</span>
            </div>
            <div className="sync-bar-track">
              <div
                className="sync-bar-fill"
                style={{ width: `${syncRate}%` }}
              />
            </div>
          </div>

          {/* CHART */}
          <div className="chart-container">
            <div className="chart-header">
              <div>
                <span className="chart-eyebrow">Activité</span>
                <h3 className="chart-title">Parcelles créées</h3>
              </div>

              {/* Navigateur semaine */}
              <div className="week-nav">
                <button className="week-nav-btn" onClick={goToPrevWeek}>
                  ‹
                </button>
                <span className="week-nav-label">
                  {formatDate(lundi)} – {formatDate(dimanche)}
                </span>
                <button
                  className="week-nav-btn"
                  onClick={goToNextWeek}
                  disabled={isCurrentWeek}
                >
                  ›
                </button>
              </div>
            </div>
            <Bar ref={chartRef} data={weekData} options={options} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profil;
