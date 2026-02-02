
'use client';

import { BakInspectorTab } from "@/components/dashboard-tabs/BakInspectorTab";
import { ProtectedRoute } from "@/components/layout/Sidebar";

export default function BakInspectorPage() {
  return (
      <ProtectedRoute>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <BakInspectorTab />
        </main>
      </ProtectedRoute>
  );
}
