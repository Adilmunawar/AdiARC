
"use client";

import { DatabaseEngineTab } from "@/components/dashboard-tabs/DatabaseEngineTab";
import { ProtectedRoute } from "@/components/layout/Sidebar";

export default function DatabaseEnginePage() {
    return (
        <ProtectedRoute>
            <DatabaseEngineTab />
        </ProtectedRoute>
    );
}
