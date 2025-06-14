
import { useState, useCallback } from 'react';

interface PaginationConfig {
  initialPage?: number;
  pageSize?: number;
}

interface PaginationReturn {
  currentPage: number;
  pageSize: number;
  offset: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  resetPagination: () => void;
}

export const usePagination = ({ 
  initialPage = 1, 
  pageSize = 20 
}: PaginationConfig = {}): PaginationReturn => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const offset = (currentPage - 1) * pageSize;

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    currentPage,
    pageSize,
    offset,
    nextPage,
    prevPage,
    setPage,
    resetPagination
  };
};
