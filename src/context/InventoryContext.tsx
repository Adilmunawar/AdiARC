"use client";

import type { InventoryItem } from '@/types';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface InventoryContextType {
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
  clearInventory: () => void;
  validItems: InventoryItem[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const clearInventory = () => setInventory([]);

  const validItems = React.useMemo(() => inventory.filter(item => item.status === 'Valid' && item.id), [inventory]);

  const value = {
    inventory,
    setInventory,
    clearInventory,
    validItems,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
