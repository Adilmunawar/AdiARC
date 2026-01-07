"use client";

import { InventoryTab } from "@/components/dashboard-tabs/InventoryTab";
import { useState } from 'react';
import type { InventoryItem } from '@/lib/forensic-utils';

export default function InventoryPage() {
    const [_inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    return <InventoryTab setInventoryItems={setInventoryItems} />;
}
