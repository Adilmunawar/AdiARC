
"use client";

import { DailyProgressTab } from "@/components/dashboard-tabs/DailyProgressTab";
import { ProtectedRoute } from "@/components/layout/Sidebar";

export default function DailyProgressPage() {
    return (
        <ProtectedRoute>
            <DailyProgressTab />
        </ProtectedRoute>
    );
}
