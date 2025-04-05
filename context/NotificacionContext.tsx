// src/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // en milisegundos
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    type: NotificationType,
    message: string,
    duration?: number,
  ) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification debe ser usado dentro de un NotificationProvider",
    );
  }

  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generar un ID único para las notificaciones
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Añadir una nueva notificación
  const addNotification = useCallback(
    (type: NotificationType, message: string, duration = 5000): void => {
      const id = generateId();
      const notification: Notification = {
        id,
        type,
        message,
        duration,
      };

      setNotifications((prev) => [...prev, notification]);

      // Eliminar automáticamente después de la duración
      if (duration !== 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [],
  );

  // Eliminar una notificación por ID
  const removeNotification = useCallback((id: string): void => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
