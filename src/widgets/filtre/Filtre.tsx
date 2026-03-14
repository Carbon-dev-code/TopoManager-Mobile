import { Dispatch, SetStateAction } from "react";
import "./Filtre.css";

interface FilterProps {
  filtreParcelle: string;
  setFiltreParcelle: Dispatch<SetStateAction<"tous" | "sync" | "nosync" | "erreur">>;
}

const Filtre: React.FC<FilterProps> = ({
  filtreParcelle,
  setFiltreParcelle,
}: FilterProps) => {
  return (
    <div className="mb-3 mt-3">
      <div className="filtre-parcelle-container">
        <div className="col-auto">
          <input
            type="radio"
            className="btn-check"
            name="filtreParcelle"
            id="tous-outlined"
            autoComplete="off"
            checked={filtreParcelle === "tous"}
            onChange={() => setFiltreParcelle("tous")}
          />
          <label className="btn rounded btn-outline-primary" htmlFor="tous-outlined">
            Tous
          </label>
        </div>
        <div className="col-auto">
          <input
            type="radio"
            className="btn-check"
            name="filtreParcelle"
            id="sync-outlined"
            autoComplete="off"
            checked={filtreParcelle === "sync"}
            onChange={() => setFiltreParcelle("sync")}
          />
          <label className="btn rounded btn-outline-primary" htmlFor="sync-outlined">
            Synchronisées
          </label>
        </div>
        <div className="col-auto">
          <input
            type="radio"
            className="btn-check"
            name="filtreParcelle"
            id="nosync-outlined"
            autoComplete="off"
            checked={filtreParcelle === "nosync"}
            onChange={() => setFiltreParcelle("nosync")}
          />
          <label className="btn rounded btn-outline-primary" htmlFor="nosync-outlined">
            Non synchronisées
          </label>
        </div>
        <div className="col-auto">
          <input
            type="radio"
            className="btn-check"
            name="filtreParcelle"
            id="error-outlined"
            autoComplete="off"
            checked={filtreParcelle === "erreur"}
            onChange={() => setFiltreParcelle("erreur")}
          />
          <label className="btn rounded btn-outline-primary" htmlFor="error-outlined">
            Avec erreurs
          </label>
        </div>
      </div>
    </div>
  );
};

export default Filtre;

