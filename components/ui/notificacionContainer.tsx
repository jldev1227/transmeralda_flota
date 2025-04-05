"use client";

import React, { useEffect, useState } from "react";

import { Notification } from "./notificacion";

import { useNotification } from "@/context/NotificacionContext";

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    // Función para detectar el scroll
    const handleScroll = () => {
      // Si el scroll es mayor a 50px, consideramos que está scrolleando
      if (window.scrollY > 50) {
        setIsScrolling(true);
      } else {
        setIsScrolling(false);
      }
    };

    // Añadir el event listener
    window.addEventListener("scroll", handleScroll);

    // Limpiar el event listener cuando el componente se desmonte
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Si no hay notificaciones, no renderizamos nada
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed ${isScrolling ? "hidden" : "top-24"} mt-1 md:right-4 z-50 flex flex-col items-end space-y-2 w-full md:max-w-sm transition-all duration-300`}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="transform transition-all duration-500 ease-in-out"
          style={{
            animation: "slideIn 0.3s ease-out forwards",
          }}
        >
          <Notification
            notification={notification}
            onDismiss={removeNotification}
          />
        </div>
      ))}
    </div>
  );
};
