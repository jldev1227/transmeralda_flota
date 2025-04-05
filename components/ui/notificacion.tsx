// src/components/ui/Notification.tsx
import React from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { Notification as NotificationType } from "@/context/NotificacionContext";

interface NotificationProps {
  notification: NotificationType;
  onDismiss: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({
  notification,
  onDismiss,
}) => {
  const { id, type, message } = notification;
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-100";
      case "error":
        return "bg-red-50 border-red-100";
      case "warning":
        return "bg-yellow-50 border-yellow-100";
      case "info":
        return "bg-blue-50 border-blue-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      case "warning":
        return "text-yellow-800";
      case "info":
        return "text-blue-800";
      default:
        return "text-gray-800";
    }
  };

  return (
    <div
      className={`max-sm:w-screen transform transition-all duration-300 ease-in-out md:rounded-lg p-4 shadow-lg border ${getBgColor()} mb-2 animate-fade-down animate-ease-in-out`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className={`ml-3 ${getTextColor()}`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              className={`inline-flex rounded-md p-1.5 ${getTextColor()} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400`}
              type="button"
              onClick={() => onDismiss(id)}
            >
              <span className="sr-only">Cerrar</span>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
