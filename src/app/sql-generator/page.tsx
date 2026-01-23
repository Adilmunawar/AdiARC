
"use client";

import { SqlGeneratorTab } from "@/components/dashboard-tabs/SqlGeneratorTab";
import { ProtectedRoute } from "@/components/layout/Sidebar";

export default function SqlGeneratorPage() {
    return (
        <ProtectedRoute>
            <SqlGeneratorTab />
        </ProtectedRoute>
    );
}
