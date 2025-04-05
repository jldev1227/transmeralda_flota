import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { NextPage } from "next";

// Función para verificar si existe la cookie de token
const isAuthenticated = (): boolean => {
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();

      if (cookie.startsWith("token=")) {
        return true;
      }
    }
  }

  return false;
};

// HOC para proteger rutas
export const withAuth = <P extends {}>(Component: NextPage<P>): NextPage<P> => {
  const AuthComponent: NextPage<P> = (props) => {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
      // Verificar autenticación
      if (!isAuthenticated()) {
        // Redireccionar al login si no hay token
        router.replace("/auth/login");
      } else {
        setLoading(false);
      }
    }, [router]);

    // Mostrar un estado de carga mientras se verifica la autenticación
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          <p className="ml-3 text-gray-600">Verificando sesión...</p>
        </div>
      );
    }

    // Renderizar el componente protegido
    return <Component {...props} />;
  };

  // Copiar las propiedades estáticas del componente original
  if (Component.getInitialProps) {
    AuthComponent.getInitialProps = Component.getInitialProps;
  }

  return AuthComponent;
};

export default withAuth;
