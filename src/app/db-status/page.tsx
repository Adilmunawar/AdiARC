
"use client";

import { DbStatusTab } from "@/components/dashboard-tabs/DbStatusTab";
import { ProtectedRoute } from "@/components/layout/Sidebar";

export default function DbStatusPage() {
    return (
        <ProtectedRoute>
            <DbStatusTab />
        </ProtectedRoute>
    );
}
