
"use client";

import { SqlPlaygroundTab } from "@/components/dashboard-tabs/SqlPlaygroundTab";
import { ProtectedRoute } from "@/components/layout/Sidebar";

export default function SqlPlaygroundPage() {
    return (
        <ProtectedRoute>
            <SqlPlaygroundTab />
        </ProtectedRoute>
    );
}
