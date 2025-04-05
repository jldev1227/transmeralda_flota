"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { FlotaProvider } from "@/context/FlotaContext";
import { NotificationContainer } from "@/components/ui/notificacionContainer";
import { NotificationProvider } from "@/context/NotificacionContext";
import { AuthProvider } from "@/context/AuthContext";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <AuthProvider>
        <NotificationProvider>
          <FlotaProvider>
            <NotificationContainer />
            <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
          </FlotaProvider>
        </NotificationProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}
