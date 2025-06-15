"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  showSearch: boolean;
  toggleSearch: () => void;
  setShowSearch: (show: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used within a SearchProvider');
  return ctx;
};

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [showSearch, setShowSearch] = useState(false);
  const toggleSearch = () => setShowSearch((prev) => !prev);
  return (
    <SearchContext.Provider value={{ showSearch, toggleSearch, setShowSearch }}>
      {children}
    </SearchContext.Provider>
  );
}; 