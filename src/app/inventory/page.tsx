
"use client";

import { InventoryTab } from "@/components/dashboard-tabs/InventoryTab";
import { useState } from "react";

// Dummy type for InventoryItem since it's not exported from the tab
type InventoryItem = {
  id: string | null;
  file: string;
  folder: string;
  source: string;
  status: "valid" | "stripped" | "no-match";
  fileObject?: File;
};


export default function InventoryPage() {
    // The InventoryTab component expects a setInventoryItems prop.
    // We'll provide a dummy state function for now.
    const [_, setInventoryItems] = useState<InventoryItem[]>([]);
    return <InventoryTab setInventoryItems={setInventoryItems} />;
}
