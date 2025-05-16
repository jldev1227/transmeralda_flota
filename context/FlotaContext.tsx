"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AxiosError, isAxiosError } from "axios";
import { addToast } from "@heroui/toast";

import { useAuth } from "./AuthContext";

import { apiClient } from "@/config/apiClient";
import socketService from "@/services/socketServices";
import { SortDescriptor } from "@/components/ui/customTable";

export interface Vehiculo {
  clase_vehiculo: string;
  color: string;
  combustible: string;
  conductor_id: string;
  createdAt: string;
  estado: string;
  fechaMatricula: string;
  galeria?: string[];
  id: string;
  kilometraje: number;
  latitud: number;
  linea: string;
  longitud: number;
  marca: string;
  modelo: string;
  numero_chasis: string;
  numero_motor: string;
  numero_serie: string;
  placa: string;
  poliza_contractual_vencimiento: string;
  poliza_extra_contractual_vencimiento: string;
  poliza_todo_riesgo_vencimiento: string;
  propietario_identificacion: string;
  propietario_nombre: string;
  propietario_id: string;
  soat_vencimiento: string;
  tarjeta_de_operacion_vencimiento: string;
  tecnomecanica_vencimiento: string;
  tipo_carroceria: string;
  updatedAt: string;
  vin: string;
}

export enum EstadoVehiculo {
  ACTIVO = "ACTIVO",
  INACTIVO = "INACTIVO",
  MANTENIMIENTO = "MANTENIMIENTO",
  DISPONIBLE = "DISPONIBLE",
}

export interface FiltrosVehiculos {
  conductor_id: string;
  fechaMatricula: string;
  estado: string;
  busqueda: string;
  marca: string;
  modelo: string;
  clase_vehiculo: string;
  vencimientoProximo: boolean;
  documentosVencidos: boolean;
}

export interface BusquedaParams {
  page?: number;
  limit?: number;
  search?: string; // Para búsqueda general (placa, marca, modelo, linea.)
  estado?: EstadoVehiculo | EstadoVehiculo[];
  sort?: string;
  order?: "ascending" | "descending";
}

export interface ValidationError {
  campo: string;
  mensaje: string;
}

export interface CrearVehiculoRequest {
  clase_vehiculo: string;
  color?: string;
  combustible?: string;
  estado?: string;
  fechaMatricula?: string;
  galeria?: string[];
  kilometraje?: number;
  latitud?: number;
  linea?: string;
  longitud?: number;
  marca: string;
  modelo?: string;
  numero_chasis?: string;
  numero_motor?: string;
  numero_serie?: string;
  placa: string;
  poliza_contractual_vencimiento?: string;
  poliza_extra_contractual_vencimiento?: string;
  poliza_todo_riesgo_vencimiento?: string;
  propietario_identificacion?: string;
  propietario_nombre?: string;
  propietario_id?: string;
  soat_vencimiento?: string;
  tarjeta_de_operacion_vencimiento?: string;
  tecnomecanica_vencimiento?: string;
  tipo_varroceria?: string;
  vin?: string;
}
export interface ActualizarVehiculoRequest
  extends Partial<CrearVehiculoRequest> {}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  currentPage?: number;
  totalPages?: number;
  message?: string;
  errores?: ValidationError[];
}

export interface VehiculosState {
  data: Vehiculo[];
  count: number;
  totalPages: number;
  currentPage: number;
}

// Funciones utilitarias
export const getEstadoColor = (estado: EstadoVehiculo) => {
  switch (estado) {
    case EstadoVehiculo.ACTIVO:
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
        dot: "bg-green-500",
        badge: "bg-green-100 text-green-800",
        color: "#16a34a",
        lightColor: "#dcfce7",
      };
    case EstadoVehiculo.INACTIVO:
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
        dot: "bg-gray-500",
        badge: "bg-gray-100 text-gray-800",
        color: "#71717a",
        lightColor: "#f4f4f5",
      };
    case EstadoVehiculo.MANTENIMIENTO:
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-200",
        dot: "bg-yellow-500",
        badge: "bg-yellow-100 text-yellow-800",
        color: "#ca8a04",
        lightColor: "#fef9c3",
      };
    case EstadoVehiculo.DISPONIBLE:
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
        dot: "bg-red-500",
        badge: "bg-red-100 text-red-800",
        color: "#dc2626",
        lightColor: "#fee2e2",
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
        dot: "bg-gray-500",
        badge: "bg-gray-100 text-gray-800",
        color: "#71717a",
        lightColor: "#f4f4f5",
      };
  }
};

export const getEstadoLabel = (estado: EstadoVehiculo): string => {
  switch (estado) {
    case EstadoVehiculo.ACTIVO:
      return "Activo";
    case EstadoVehiculo.INACTIVO:
      return "Inactivo";
    case EstadoVehiculo.MANTENIMIENTO:
      return "Suspendido";
    case EstadoVehiculo.DISPONIBLE:
      return "Retirado";
    default:
      return "Desconocido";
  }
};

export interface SocketEventLog {
  eventName: string;
  data: any;
  timestamp: Date;
}

// Interfaz para el contexto
interface FlotaContextType {
  // Estado
  vehiculosState: VehiculosState;
  currentVehiculo: Vehiculo | null;
  loading: boolean;
  error: string | null;
  validationErrors: ValidationError[] | null;
  sortDescriptor: SortDescriptor;

  // Operaciones CRUD
  fetchVehiculos: (paramsBusqueda: BusquedaParams) => Promise<void>;
  getVehiculo: (id: string) => Promise<Vehiculo | null>;
  crearVehiculoBasico: (data: CrearVehiculoRequest) => Promise<Vehiculo | null>;
  actualizarVehiculoBasico: (
    id: string,
    data: ActualizarVehiculoRequest,
  ) => Promise<Vehiculo | null>;

  // Funciones de utilidad
  handlePageChange: (page: number) => void;
  handleSortChange: (descriptor: SortDescriptor) => void;
  clearError: () => void;
  setCurrentVehiculo: (vehiculo: Vehiculo | null) => void;

  // Nuevas propiedades para Socket.IO
  socketConnected?: boolean;
  socketEventLogs?: SocketEventLog[];
  clearSocketEventLogs?: () => void;
}

// Props para el provider
interface FlotaProviderProps {
  children: ReactNode;
}

// Crear el contexto
const FlotaContext = createContext<FlotaContextType | undefined>(undefined);

// Proveedor del contexto
export const FlotaProvider: React.FC<FlotaProviderProps> = ({ children }) => {
  const [vehiculosState, setVehiculosState] = useState<VehiculosState>({
    data: [],
    count: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [currentVehiculo, setCurrentVehiculo] = useState<Vehiculo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    ValidationError[] | null
  >(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Estado para Socket.IO
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [socketEventLogs, setSocketEventLogs] = useState<SocketEventLog[]>([]);
  const { user } = useAuth();

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "placa",
    direction: "ascending",
  });

  // Función para manejar errores de Axios
  const handleApiError = (err: unknown, defaultMessage: string): string => {
    if (isAxiosError(err)) {
      const axiosError = err as AxiosError<ApiResponse<any>>;

      if (axiosError.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        const statusCode = axiosError.response.status;
        const errorMessage = axiosError.response.data?.message;
        const validationErrors = axiosError.response.data?.errores;

        if (validationErrors) {
          setValidationErrors(validationErrors);
        }

        if (statusCode === 401) {
          return "Sesión expirada o usuario no autenticado";
        } else if (statusCode === 403) {
          return "No tienes permisos para realizar esta acción";
        } else if (statusCode === 404) {
          return "Vehiculo no encontrado";
        } else {
          return errorMessage || `Error en la petición (${statusCode})`;
        }
      } else if (axiosError.request) {
        // La petición fue hecha pero no se recibió respuesta
        return "No se pudo conectar con el servidor. Verifica tu conexión a internet";
      } else {
        // Error al configurar la petición
        return `Error al configurar la petición: ${axiosError.message}`;
      }
    } else {
      // Error que no es de Axios
      return `${defaultMessage}: ${(err as Error).message}`;
    }
  };

  // Función para limpiar errores
  const clearError = () => {
    setError(null);
    setValidationErrors(null);
  };

  // Operaciones CRUD
  const fetchVehiculos = async (paramsBusqueda: BusquedaParams = {}) => {
    setLoading(true);
    clearError();

    try {
      // Prepara los parámetros básicos
      const params: any = {
        page: paramsBusqueda.page || vehiculosState.currentPage,
        limit: paramsBusqueda.limit || 10,
        sort: paramsBusqueda.sort || sortDescriptor.column,
        order: paramsBusqueda.order || sortDescriptor.direction,
      };

      // Añade el término de búsqueda si existe
      if (paramsBusqueda.search) {
        params.search = paramsBusqueda.search;
      }

      // Añade filtros de estado
      if (paramsBusqueda.estado) {
        if (Array.isArray(paramsBusqueda.estado)) {
          params.estado = paramsBusqueda.estado.join(",");
        } else {
          params.estado = paramsBusqueda.estado;
        }
      }

      const response = await apiClient.get<ApiResponse<Vehiculo[]>>(
        "/api/flota",
        {
          params,
        },
      );

      if (response.data && response.data.success) {
        setVehiculosState({
          data: response.data.data,
          count: response.data.count || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: parseInt(params.page) || 1,
        });

        return;
      } else {
        throw new Error("Respuesta no exitosa del servidor");
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Error al obtener conductores");

      setError(errorMessage);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const getVehiculo = async (id: string): Promise<Vehiculo | null> => {
    setLoading(true);
    clearError();

    try {
      const response = await apiClient.get<ApiResponse<Vehiculo>>(
        `/api/conductores/${id}`,
      );

      if (response.data && response.data.success) {
        const conductor = response.data.data;

        setCurrentVehiculo(conductor);

        return conductor;
      } else {
        throw new Error("Respuesta no exitosa del servidor");
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Error al obtener el conductor");

      setError(errorMessage);

      return null;
    } finally {
      setLoading(false);
    }
  };

  const crearVehiculoBasico = async (
    data: CrearVehiculoRequest,
  ): Promise<Vehiculo> => {
    // Cambiado el tipo de retorno para no permitir null
    clearError();

    try {
      const response = await apiClient.post<ApiResponse<Vehiculo>>(
        "/api/flota/basico",
        data,
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Error al crear conductor");
      }
    } catch (err: any) {
      // Definir un mensaje de error predeterminado
      let errorTitle = "Error al crear conductor";
      let errorDescription = "Ha ocurrido un error inesperado.";

      // Manejar errores específicos por código de estado
      if (err.response) {
        switch (err.response.status) {
          case 400: // Bad Request
            errorTitle = "Error en los datos enviados";

            // Verificar si tenemos detalles específicos del error en la respuesta
            if (err.response.data && err.response.data.message) {
              errorDescription = err.response.data.message;
            }

            // Verificar si hay errores específicos en formato español (errores)
            if (
              err.response.data &&
              err.response.data.errores &&
              Array.isArray(err.response.data.errores)
            ) {
              // Mapeo de nombres de campos para mensajes más amigables
              const fieldLabels: Record<string, string> = {
                placa: "Placa",
                marca: "Marca",
                linea: "Linea del vehículo",
                color: "Color del vehículo",
                clase_vehiculo: "Clase del vehículo",
              };

              // Mostrar cada error de validación como un toast separado
              let errorShown = false;

              err.response.data.errores.forEach(
                (error: { campo: string; mensaje: string }) => {
                  errorShown = true;
                  const fieldLabel = fieldLabels[error.campo] || error.campo;

                  // Personalizar mensajes para errores comunes
                  let customMessage = error.mensaje;

                  if (error.mensaje.includes("must be unique")) {
                    customMessage = `Este ${fieldLabel.toLowerCase()} ya está registrado en el sistema`;
                  }

                  addToast({
                    title: `Error en ${fieldLabel}`,
                    description: customMessage,
                    color: "danger",
                  });
                },
              );

              // IMPORTANTE: Ya no hacemos return null aquí
              // Solo actualizamos el mensaje de error general
              if (errorShown) {
                setError(errorDescription);
                // Arrojamos un nuevo error en lugar de retornar null
                throw new Error("Error de validación en los campos");
              }
            }

            // Verificar errores específicos comunes en el mensaje
            if (
              errorDescription.includes("unique") ||
              errorDescription.includes("duplicado")
            ) {
              // Error genérico de duplicación
              errorTitle = "Datos duplicados";
              errorDescription =
                "Algunos de los datos ingresados ya existen en el sistema.";

              // Intentar ser más específico basado en el mensaje completo
              if (errorDescription.toLowerCase().includes("placa")) {
                errorTitle = "Placa duplicada";
                errorDescription = "Ya existe un conductor con este placa.";
              }
            }
            break;

          // Los demás casos igual que antes...
        }
      } else if (err.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        errorTitle = "Error de conexión";
        errorDescription =
          "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
      } else {
        // Algo sucedió al configurar la solicitud que desencadenó un error
        errorTitle = "Error en la solicitud";
        errorDescription =
          err.message || "Ha ocurrido un error al procesar la solicitud.";
      }

      // Guardar el mensaje de error para referencia en el componente
      setError(errorDescription);

      // Mostrar el toast con el mensaje de error
      addToast({
        title: errorTitle,
        description: errorDescription,
        color: "danger",
      });

      // Registrar el error en la consola para depuración
      console.error("Error detallado:", err);

      // Siempre lanzamos el error, nunca retornamos null
      throw err;
    }
    // Ya no necesitamos un bloque finally aquí, el setLoading lo manejamos en guardarConductor
  };

  const actualizarVehiculoBasico = async (
    id: string,
    data: ActualizarVehiculoRequest,
  ): Promise<Vehiculo | null> => {
    setLoading(true);
    clearError();

    try {
      const response = await apiClient.put<ApiResponse<Vehiculo>>(
        `/api/flota/${id}/basico`,
        data,
      );

      if (response.data && response.data.success) {
        const vehiculoActualizado = response.data.data;

        // Actualizar el currentVehiculo si corresponde al mismo ID
        if (currentVehiculo && currentVehiculo.id === id) {
          setCurrentVehiculo(vehiculoActualizado);
        }

        const params: BusquedaParams = {
          page: vehiculosState.currentPage,
        };

        // Actualizar la lista de conductores
        fetchVehiculos(params);

        return vehiculoActualizado;
      } else {
        throw new Error("Respuesta no exitosa del servidor");
      }
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Error al actualizar el conductor",
      );

      setError(errorMessage);

      return null;
    } finally {
      setLoading(false);
    }
  };

  // Funciones de utilidad
  const handlePageChange = (page: number) => {
    setVehiculosState((prevState) => ({
      ...prevState,
      currentPage: page,
    }));
  };

  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
    setVehiculosState((prevState) => ({
      ...prevState,
      currentPage: 1,
    }));

    const params: BusquedaParams = {
      page: vehiculosState.currentPage,
    };

    fetchVehiculos(params);
  };

  // Efecto que se ejecuta cuando cambia la página actual
  useEffect(() => {
    const params: BusquedaParams = {
      page: vehiculosState.currentPage,
    };

    fetchVehiculos(params);
  }, [vehiculosState.currentPage]);

  // Efecto de inicialización
  useEffect(() => {
    const params: BusquedaParams = {
      page: vehiculosState.currentPage,
    };

    fetchVehiculos(params);

    // Establecer un tiempo máximo para la inicialización
    const timeoutId = setTimeout(() => {
      if (initializing) {
        setInitializing(false);
      }
    }, 5000); // 5 segundos máximo de espera

    return () => clearTimeout(timeoutId);
  }, []);

  // Inicializar Socket.IO cuando el usuario esté autenticado
  useEffect(() => {
    if (user?.id) {
      // Conectar socket
      socketService.connect(user.id);

      // Verificar conexión inicial y configurar manejo de eventos de conexión
      const checkConnection = () => {
        const isConnected = socketService.isConnected();

        setSocketConnected(isConnected);
      };

      // Verificar estado inicial
      checkConnection();

      // Manejar eventos de conexión
      const handleConnect = () => {
        setSocketConnected(true);
      };

      const handleDisconnect = () => {
        setSocketConnected(false);
      };

      const handleVehiculoCreado = (data: Vehiculo) => {
        setSocketEventLogs((prev) => [
          ...prev,
          {
            eventName: "vehiculo:creado",
            data,
            timestamp: new Date(),
          },
        ]);

        addToast({
          title: "Nuevo Vehículo",
          description: `Se ha creado un nuevo vehículo: ${data.placa}`,
          color: "success",
        });
      };

      const handleVehiculoActualizado = (data: Vehiculo) => {
        setSocketEventLogs((prev) => [
          ...prev,
          {
            eventName: "vehiculo:actualizado",
            data,
            timestamp: new Date(),
          },
        ]);

        addToast({
          title: "Vehículo Actualizado",
          description: `Se ha actualizado la información del vehículo: ${data.placa}`,
          color: "primary",
        });
      };

      // Registrar manejadores de eventos
      socketService.on("connect", handleConnect);
      socketService.on("disconnect", handleDisconnect);

      // Registrar manejadores de eventos de vehículos
      socketService.on("vehiculo:creado", handleVehiculoCreado);
      socketService.on("vehiculo:actualizado", handleVehiculoActualizado);

      return () => {
        // Limpiar al desmontar
        socketService.off("connect");
        socketService.off("disconnect");

        // Limpiar manejadores de eventos de conductores
        socketService.off("vehiculo:creado");
        socketService.off("vehiculo:actualizado");
      };
    }
  }, [user?.id]);

  // Función para limpiar el registro de eventos de socket
  const clearSocketEventLogs = useCallback(() => {
    setSocketEventLogs([]);
  }, []);

  // Valor del contexto
  const vehiculoContext: FlotaContextType = {
    // Datos
    vehiculosState,
    currentVehiculo,
    loading,
    error,
    validationErrors,
    sortDescriptor,

    fetchVehiculos,
    getVehiculo,
    crearVehiculoBasico,
    actualizarVehiculoBasico,

    // Propiedades para Socket.IO
    socketConnected,
    socketEventLogs,
    clearSocketEventLogs,

    handlePageChange,
    handleSortChange,
    clearError,
    setCurrentVehiculo,
  };

  return (
    <FlotaContext.Provider value={vehiculoContext}>
      {children}
    </FlotaContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useFlota = (): FlotaContextType => {
  const context = useContext(FlotaContext);

  if (!context) {
    throw new Error("useFlota debe ser usado dentro de un FlotaProvider");
  }

  return context;
};

export default FlotaContext;
