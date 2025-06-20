// client-layout.tsx
"use client";

import DynamicTitle from "@/components/ui/dynamicTitle";
import { useAuth } from "@/context/AuthContext";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto" />
          <p className="mt-4 text-emerald-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[100dvh]">
      <DynamicTitle />
      <main className="bg-gray-50 flex-grow overflow-auto">{children}</main>
    </div>
  );
}
