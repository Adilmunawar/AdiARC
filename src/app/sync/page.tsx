
"use client";

import { ServerSyncTab } from "@/components/dashboard-tabs/ServerSyncTab";
import { ProtectedRoute } from "@/components/layout/Sidebar";

export default function SyncPage() {
    return (
        <ProtectedRoute>
            <ServerSyncTab />
        </ProtectedRoute>
    );
}
