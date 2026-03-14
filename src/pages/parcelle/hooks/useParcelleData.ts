import { useState, useCallback } from "react";
import { Parcelle } from "../../../entities/parcelle";
import { getAllParcelles, deleteParcelle } from "../../../shared/lib/db/DbSchema";

export const useParcelleData = (itemsPerPage: number = 10) => {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalParcelles, setTotalParcelles] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async (page: number = 1) => {
    const { data, total } = await getAllParcelles(page, itemsPerPage);
    setParcelles(data);
    setTotalParcelles(total);
  }, [itemsPerPage]);

  const removeParcelle = useCallback((code: string, synchronise?: number) => {
    deleteParcelle(code);

    if (synchronise === 1) {
      return {
        success: false,
        message: "Cette parcelle est déjà synchronisée et ne peut pas être supprimée."
      };
    }
    
    return {
      success: true,
      codeToRemove: code
    };
  }, []);

  const confirmRemoveParcelle = useCallback(async (code: string) => {
    await deleteParcelle(code);
    const newTotal = totalParcelles - 1;
    const maxPage = Math.ceil(newTotal / itemsPerPage) || 1;
    setTotalParcelles(newTotal);
    setParcelles((prev) => prev.filter((p) => p.code !== code));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [totalParcelles, currentPage, itemsPerPage]);

  const updateParcelle = useCallback((updatedParcelle: Parcelle) => {
    setParcelles((prev) => 
      prev.map((p) => (p.code === updatedParcelle.code ? updatedParcelle : p))
    );
  }, []);

  const addParcelle = useCallback((newParcelle: Parcelle) => {
    const newTotal = totalParcelles + 1;
    const lastPage = Math.ceil(newTotal / itemsPerPage);
    setTotalParcelles(newTotal);
    if (lastPage !== currentPage) {
      setCurrentPage(lastPage);
    } else {
      setParcelles((prev) => [...prev, newParcelle]);
    }
  }, [totalParcelles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(totalParcelles / itemsPerPage);

  return {
    parcelles,
    currentPage,
    totalParcelles,
    searchQuery,
    totalPages,
    loadData,
    removeParcelle,
    confirmRemoveParcelle,
    updateParcelle,
    addParcelle,
    setCurrentPage,
    setSearchQuery,
    setParcelles,
    setTotalParcelles
  };
};
