
"use client";

import { PowerShellQueriesTab } from "@/components/dashboard-tabs/PowerShellQueriesTab";
import { ProtectedRoute } from "@/components/layout/Sidebar";

export default function PowerShellQueriesPage() {
    return (
        <ProtectedRoute>
            <PowerShellQueriesTab />
        </ProtectedRoute>
    );
}
