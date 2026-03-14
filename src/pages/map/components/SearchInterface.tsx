import React from "react";
import { IonInput } from "@ionic/react";

interface SearchInterfaceProps {
  onSearch: (value: string) => void;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onSearch,
}) => {
  return (
    <div className="map-search">
      <div className="search-glass">
        <IonInput
          type="search"
          placeholder="Recherche titre, karatany, ipss, ..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value;
              if (val?.trim()) onSearch(val.trim());
            }
          }}
        />
      </div>
    </div>
  );
};
