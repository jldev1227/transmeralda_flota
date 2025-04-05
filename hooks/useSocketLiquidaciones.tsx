import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

import socketService from "@/services/socketServices";
import { useAuth } from "@/context/AuthContext";

interface SocketEventLog {
  eventName: string;
  data: any;
  timestamp: Date;
}

interface SocketEventHandlers {
  onLiquidacionCreada?: (data: {
    liquidacion: Liquidacion;
    usuarioCreador: string;
  }) => void;
  onLiquidacionActualizada?: (data: {
    liquidacion: Liquidacion;
    usuarioActualizador: string;
    cambios: any;
  }) => void;
  onLiquidacionEliminada?: (data: {
    liquidacionId: string;
    usuarioEliminador: string;
  }) => void;
  onCambioEstadoLiquidacion?: (data: {
    liquidacionId: string;
    estadoAnterior: string;
    nuevoEstado: string;
    usuarioResponsable: string;
    comentario?: string;
  }) => void;
}

export const useSocketLiquidaciones = (handlers?: SocketEventHandlers) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [eventLogs, setEventLogs] = useState<SocketEventLog[]>([]);

  // Inicializar conexión de socket
  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);

      // Manejar eventos de conexión/desconexión
      const handleConnect = () => {
        setIsConnected(true);
        toast.success("Conectado para actualizaciones en tiempo real", {
          id: "socket-connect",
          duration: 3000,
        });
      };

      const handleDisconnect = () => {
        setIsConnected(false);
        // toast.warning('Desconectado de actualizaciones en tiempo real', {
        //   id: 'socket-disconnect',
        //   duration: 3000
        // });
      };

      // Monitorear cambios en el estado de conexión
      if (socketService.isConnected()) {
        handleConnect();
      }

      // Solo agregar listeners si aún no están establecidos
      socketService.on("connect", handleConnect);
      socketService.on("disconnect", handleDisconnect);

      return () => {
        socketService.off("connect");
        socketService.off("disconnect");
      };
    }
  }, [user?.id]);

  // Configurar listeners para eventos de liquidaciones
  useEffect(() => {
    if (!user?.id) return;

    // Nueva liquidación creada
    const handleLiquidacionCreada = (data: any) => {
      logEvent("liquidacion_creada", data);

      // Mostrar notificación
      //   toast.success(`Nueva liquidación creada por ${data.usuarioCreador}`, {
      //     duration: 4000
      //   });

      // Llamar al manejador personalizado si existe
      if (handlers?.onLiquidacionCreada) {
        handlers.onLiquidacionCreada(data);
      }
    };

    // Liquidación actualizada
    const handleLiquidacionActualizada = (data: any) => {
      logEvent("liquidacion_actualizada", data);

      // Mostrar notificación
      //   toast.info(`Liquidación actualizada por ${data.usuarioActualizador}`, {
      //     duration: 4000
      //   });

      // Llamar al manejador personalizado si existe
      if (handlers?.onLiquidacionActualizada) {
        handlers.onLiquidacionActualizada(data);
      }
    };

    // Liquidación eliminada
    const handleLiquidacionEliminada = (data: any) => {
      logEvent("liquidacion_eliminada", data);

      // Mostrar notificación
      //   toast.warning(`Liquidación eliminada por ${data.usuarioEliminador}`, {
      //     duration: 4000
      //   });

      // Llamar al manejador personalizado si existe
      if (handlers?.onLiquidacionEliminada) {
        handlers.onLiquidacionEliminada(data);
      }
    };

    // Cambio de estado de liquidación
    const handleCambioEstadoLiquidacion = (data: any) => {
      logEvent("cambio_estado_liquidacion", data);

      // Personalizar notificación según el estado
      let toastMessage = `Liquidación cambió de estado: ${data.estadoAnterior} → ${data.nuevoEstado}`;

      // Por esto:
      if (data.nuevoEstado === "Liquidado") {
        toastMessage = `¡Liquidación finalizada por ${data.usuarioResponsable}!`;
        toast.success(toastMessage, { duration: 4000 });
      } else if (data.nuevoEstado === "Pendiente") {
        toastMessage = `Liquidación marcada como pendiente por ${data.usuarioResponsable}`;
        toast.success(toastMessage, { duration: 4000 });
      } else {
        toastMessage = `Liquidación cambió de estado: ${data.estadoAnterior} → ${data.nuevoEstado}`;
        toast.success(toastMessage, { duration: 4000 });
      }

      // Llamar al manejador personalizado si existe
      if (handlers?.onCambioEstadoLiquidacion) {
        handlers.onCambioEstadoLiquidacion(data);
      }
    };

    // Registrar los listeners
    socketService.on("liquidacion_creada", handleLiquidacionCreada);
    socketService.on("liquidacion_actualizada", handleLiquidacionActualizada);
    socketService.on("liquidacion_eliminada", handleLiquidacionEliminada);
    socketService.on(
      "cambio_estado_liquidacion",
      handleCambioEstadoLiquidacion,
    );

    // Limpiar al desmontar
    return () => {
      socketService.off("liquidacion_creada");
      socketService.off("liquidacion_actualizada");
      socketService.off("liquidacion_eliminada");
      socketService.off("cambio_estado_liquidacion");
    };
  }, [user?.id, handlers]);

  // Función para registrar eventos en el log
  const logEvent = useCallback((eventName: string, data: any) => {
    setEventLogs((prevLogs) => [
      {
        eventName,
        data,
        timestamp: new Date(),
      },
      ...prevLogs,
    ]);
  }, []);

  // Función para limpiar logs de eventos
  const clearEventLogs = useCallback(() => {
    setEventLogs([]);
  }, []);

  return {
    isConnected,
    eventLogs,
    clearEventLogs,
  };
};
