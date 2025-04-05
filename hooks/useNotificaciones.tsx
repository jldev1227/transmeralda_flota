// src/hooks/useNotificaciones.ts
import { useCallback } from "react";

import { useNotification } from "@/context/NotificacionContext";

interface UseNotificacionesOptions {
  /**
   * Habilitar/deshabilitar notificaciones (por defecto habilitadas)
   */
  enabled?: boolean;
}

/**
 * Hook para mostrar notificaciones basadas en resultados de peticiones API
 */
export const useNotificaciones = (options: UseNotificacionesOptions = {}) => {
  const { enabled = true } = options;
  const { addNotification } = useNotification();

  /**
   * Mostrar notificación basada en el tipo y mensaje
   */
  const mostrarNotificacion = useCallback(
    (
      tipo: "success" | "error" | "warning" | "info",
      mensaje: string,
      duracion?: number,
    ) => {
      if (!enabled) return;
      addNotification(tipo, mensaje, duracion);
    },
    [enabled, addNotification],
  );

  /**
   * Mostrar notificación según el resultado de la operación
   */
  const notificarResultado = useCallback(
    (exito: boolean, mensajeExito: string, mensajeError?: string) => {
      if (!enabled) return;

      if (exito) {
        addNotification("success", mensajeExito);
      } else if (mensajeError) {
        addNotification("error", mensajeError);
      }
    },
    [enabled, addNotification],
  );

  /**
   * Mostrar notificación para operaciones CRUD comunes
   */
  const notificarCRUD = useCallback(
    (
      operacion:
        | "crear"
        | "editar"
        | "eliminar"
        | "registrar"
        | "enviar"
        | "generar",
      entidad: string,
      exito: boolean,
      error?: string,
    ) => {
      if (!enabled) return;

      const mensajes = {
        crear: {
          success: `${entidad} creado correctamente`,
          error: `Error al crear ${entidad}`,
        },
        editar: {
          success: `${entidad} actualizado correctamente`,
          error: `Error al actualizar ${entidad}`,
        },
        eliminar: {
          success: `${entidad} eliminado correctamente`,
          error: `Error al eliminar ${entidad}`,
        },
        registrar: {
          success: `${entidad} registrado correctamente`,
          error: `Error al registrar ${entidad}`,
        },
        enviar: {
          success: `${entidad} enviado correctamente`,
          error: `Error al enviar ${entidad}`,
        },
        generar: {
          success: `${entidad} generado correctamente`,
          error: `Error al generar ${entidad}`,
        },
      };

      if (exito) {
        addNotification("success", mensajes[operacion].success);
      } else {
        addNotification("error", error || mensajes[operacion].error);
      }
    },
    [enabled, addNotification],
  );

  return {
    mostrarNotificacion,
    notificarResultado,
    notificarCRUD,
  };
};
