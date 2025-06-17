"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
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
  fecha_matricula: string;
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
  propietario_identificacion: string;
  propietario_nombre: string;
  propietario_id: string;
  tipo_carroceria: string;
  updatedAt: string;
  vin: string;
  documentos?: Documento[];
  [key: string]: any;
}

export enum EstadoVehiculo {
  "NO DISPONIBLE" = "NO DISPONIBLE",
  INACTIVO = "INACTIVO",
  MANTENIMIENTO = "MANTENIMIENTO",
  DISPONIBLE = "DISPONIBLE",
}

export interface FiltrosVehiculos {
  conductor_id: string;
  fecha_matricula: string;
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
  categoriasDocumentos?: string | string[]; // ✅ Opcional
  estadosDocumentos?: string | string[]; // ✅ Opcional
  fechaVencimientoDesde?: string; // ✅ Opcional y string simple
  fechaVencimientoHasta?: string; // ✅ Opcional y string simple
  diasAlerta?: number; // ✅ Opcional
  clase?: string | string[];
  sort?: string;
  order?: "ascending" | "descending";
}

export interface ValidationError {
  campo: string;
  mensaje: string;
}

export interface DocumentoVehiculo {
  file: File;
  fecha_vigencia?: string;
}

export interface DocumentosVehiculo {
  TARJETA_DE_PROPIEDAD?: DocumentoVehiculo;
  SOAT?: DocumentoVehiculo;
  TECNOMECANICA?: DocumentoVehiculo;
  TARJETA_DE_OPERACION?: DocumentoVehiculo;
  POLIZA_CONTRACTUAL?: DocumentoVehiculo;
  POLIZA_EXTRACONTRACTUAL?: DocumentoVehiculo;
  POLIZA_TODO_RIESGO?: DocumentoVehiculo;
}

export interface FechasVigenciaVehiculo {
  SOAT?: string;
  TECNOMECANICA?: string;
  TARJETA_DE_OPERACION?: string;
  POLIZA_CONTRACTUAL?: string;
  POLIZA_EXTRACONTRACTUAL?: string;
  POLIZA_TODO_RIESGO?: string;
}

export interface CrearVehiculoRequest {
  // Campos básicos del vehículo
  clase_vehiculo: string;
  color?: string;
  combustible?: string;
  estado?: string;
  fecha_matricula?: string;
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

  // Información del propietario
  propietario_identificacion?: string;
  propietario_nombre?: string;
  propietario_id?: string;

  // Otros campos
  tipo_varroceria?: string;
  vin?: string;

  // NUEVOS CAMPOS PARA DOCUMENTOS
  documentos?: DocumentosVehiculo;
  fechasVigencia?: FechasVigenciaVehiculo;
}

// Tipos específicos para diferentes tipos de creación
export interface crearVehiculoRequest
  extends Omit<CrearVehiculoRequest, "documentos" | "fechasVigencia"> {}

export interface CrearVehiculoConDocumentosRequest
  extends CrearVehiculoRequest {
  documentos: DocumentosVehiculo;
  fechasVigencia?: FechasVigenciaVehiculo;
}

export interface ActualizarVehiculoRequest
  extends Partial<CrearVehiculoRequest & { id: string }> {}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  currentPage?: number;
  totalPages?: number;
  message?: string;
  errores?: ValidationError[];
}

interface CrearVehiculoConDocumentosResponse {
  vehiculo: Vehiculo;
  documentos: Documento[];
}

export interface Documento {
  id: string;
  vehiculo_id: string;
  categoria: string;
  nombre_original: string;
  nombre_archivo: string;
  ruta_archivo: string;
  s3_key: string;
  filename: string;
  mimetype: string;
  size: number;
  fecha_vigencia: string;
  estado: string;
  upload_date: string;
  metadata: {
    size: number;
    bucket: string;
    s3Location: string;
    processedAt: string;
    originalPath: string;
    fileExtension: string;
    uploadSession: string;
  };
  createdAt: string;
  updatedAt: string;
  modelo_id: string | null;
}

export interface VehiculosState {
  data: Vehiculo[];
  count: number;
  totalPages: number;
  currentPage: number;
}

interface ErrorProcesamiento {
  error: string;
  mensaje: string;
  sessionId: string;
  vehiculo: Vehiculo;
}

interface Procesamiento {
  sessionId: string | null;
  procesados: number;
  total: number;
  estado: string | null;
  mensaje: string;
  error: string | null;
  progreso: number;
  vehiculo?: Vehiculo;
}

export const initialProcesamientoState: Procesamiento = {
  sessionId: "",
  procesados: 0,
  total: 0,
  progreso: 0,
  estado: null,
  mensaje: "",
  error: "",
};

// Funciones utilitarias
export const getEstadoColor = (estado: EstadoVehiculo) => {
  switch (estado) {
    case EstadoVehiculo["NO DISPONIBLE"]:
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
  procesamiento: Procesamiento;
  modalDetalleOpen: boolean;
  selectedVehiculoId: string | null;
  modalFormOpen: boolean;
  vehiculoParaEditar: Vehiculo | null;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setModalDetalleOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedVehiculoId: Dispatch<SetStateAction<string | null>>;
  setModalFormOpen: Dispatch<SetStateAction<boolean>>;
  setVehiculoParaEditar: Dispatch<SetStateAction<Vehiculo | null>>;
  setProcesamiento: Dispatch<SetStateAction<Procesamiento>>;

  // Operaciones CRUD
  fetchVehiculos: (paramsBusqueda: BusquedaParams) => Promise<void>;
  getVehiculo: (id: string) => Promise<Vehiculo | null>;
  crearVehiculo: (data: CrearVehiculoRequest) => Promise<Vehiculo | null>;
  actualizarVehiculo: (
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

  // Estados para los modales
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string | null>(
    null,
  );
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [vehiculoParaEditar, setVehiculoParaEditar] = useState<Vehiculo | null>(
    null,
  );

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "placa",
    direction: "ascending",
  });

  // Estado para el procesamiento de documentos
  const [procesamiento, setProcesamiento] = useState<Procesamiento>(
    initialProcesamientoState,
  );

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
        limit: paramsBusqueda.limit || 5,
        sort: paramsBusqueda.sort || sortDescriptor.column,
        order: paramsBusqueda.order || sortDescriptor.direction,
      };

      // Añade el término de búsqueda si existe
      if (paramsBusqueda.search) {
        params.search = paramsBusqueda.search;
      }

      // ====== FILTROS BÁSICOS DE VEHÍCULOS ======

      // Añade filtros de estado
      if (paramsBusqueda.estado) {
        if (Array.isArray(paramsBusqueda.estado)) {
          params.estado = paramsBusqueda.estado.join(",");
        } else {
          params.estado = paramsBusqueda.estado;
        }
      }

      // Añade filtros de clase
      if (paramsBusqueda.clase) {
        if (Array.isArray(paramsBusqueda.clase)) {
          params.clase = paramsBusqueda.clase.join(",");
        } else {
          params.clase = paramsBusqueda.clase;
        }
      }

      // ====== NUEVOS FILTROS DE DOCUMENTOS ======

      // Filtros por categorías de documentos
      if (paramsBusqueda.categoriasDocumentos) {
        if (Array.isArray(paramsBusqueda.categoriasDocumentos)) {
          params.categoriasDocumentos =
            paramsBusqueda.categoriasDocumentos.join(",");
        } else {
          params.categoriasDocumentos = paramsBusqueda.categoriasDocumentos;
        }
      }

      // Filtros por estados de documentos
      if (paramsBusqueda.estadosDocumentos) {
        if (Array.isArray(paramsBusqueda.estadosDocumentos)) {
          params.estadosDocumentos = paramsBusqueda.estadosDocumentos.join(",");
        } else {
          params.estadosDocumentos = paramsBusqueda.estadosDocumentos;
        }
      }

      // Filtros por fechas de vencimiento
      if (paramsBusqueda.fechaVencimientoDesde) {
        params.fechaVencimientoDesde = paramsBusqueda.fechaVencimientoDesde;
      }

      if (paramsBusqueda.fechaVencimientoHasta) {
        params.fechaVencimientoHasta = paramsBusqueda.fechaVencimientoHasta;
      }

      // Filtro por días de alerta
      if (paramsBusqueda.diasAlerta) {
        params.diasAlerta = paramsBusqueda.diasAlerta;
      }

      const response = await apiClient.get<ApiResponse<Vehiculo[]>>(
        "/api/flota",
        {
          params,
        },
      );

      if (response.data && response.data.success) {
        // Asume que el backend siempre retorna todos los vehículos (sin paginar)
        const allVehiculos = response.data.data || [];
        const totalCount = allVehiculos.length;
        const pageSize = params.limit ? parseInt(params.limit) : 5;
        const currentPage = params.page ? parseInt(params.page) : 1;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

        // Calcular el slice para la página actual
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const paginatedVehiculos = allVehiculos.slice(startIdx, endIdx);

        setVehiculosState({
          data: paginatedVehiculos,
          count: totalCount,
          totalPages,
          currentPage,
        });

        return;
      } else {
        throw new Error("Respuesta no exitosa del servidor");
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Error al obtener vehículos");

      console.error("Error en fetchVehiculos:", errorMessage);
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
        `/api/flota/${id}`,
      );

      if (response.data && response.data.success) {
        const vehiculo = response.data.data;

        setCurrentVehiculo(vehiculo);

        return vehiculo;
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

  // ✅ ALTERNATIVA: Función helper para validar documentos de forma más segura
  const validarDocumentos = (
    documentos: DocumentosVehiculo | undefined,
  ): boolean => {
    if (!documentos) return false;

    return Object.keys(documentos).length > 0;
  };

  const extraerFechasVigencia = (
    documentos: DocumentosVehiculo | undefined,
  ): Record<string, string> => {
    const fechas: Record<string, string> = {};

    if (!documentos) return fechas;

    Object.entries(documentos).forEach(([categoria, documento]) => {
      if (documento?.fecha_vigencia) {
        fechas[categoria] = documento.fecha_vigencia;
      }
    });

    return fechas;
  };

  const extraerCategorias = (
    documentos: DocumentosVehiculo | undefined,
  ): string[] => {
    const categorias: string[] = [];

    if (!documentos) return categorias;

    Object.entries(documentos).forEach(([categoria, documento]) => {
      if (documento?.file) {
        categorias.push(categoria);
      }
    });

    return categorias;
  };

  // ✅ VERSION MEJORADA usando las funciones helper:
  const crearVehiculo = async (
    data: CrearVehiculoRequest,
  ): Promise<Vehiculo> => {
    clearError();
    try {
      const tieneDocumentos = validarDocumentos(data.documentos);

      let endpoint: string;
      let requestData: any;
      let headers: Record<string, string> = {};

      if (tieneDocumentos) {
        endpoint = "/api/flota";
        const formData = new FormData();

        // Agregar datos básicos del vehículo
        Object.keys(data).forEach((key) => {
          if (key !== "documentos" && key !== "fechasVigencia") {
            const value = data[key as keyof CrearVehiculoRequest];

            if (value !== undefined && value !== null) {
              formData.append(key, value.toString());
            }
          }
        });

        // Extraer fechas de vigencia usando función helper
        const fechasVigencia = extraerFechasVigencia(data.documentos);

        if (Object.keys(fechasVigencia).length > 0) {
          formData.append("fechasVigencia", JSON.stringify(fechasVigencia));
        }

        if (data.fechasVigencia && Object.keys(fechasVigencia).length === 0) {
          formData.append(
            "fechasVigencia",
            JSON.stringify(data.fechasVigencia),
          );
        }

        // Agregar archivos usando función helper
        const categorias = extraerCategorias(data.documentos);

        if (data.documentos) {
          Object.entries(data.documentos).forEach(([_, documento]) => {
            if (documento?.file) {
              formData.append("documentos", documento.file);
            }
          });
        }

        formData.append("categorias", JSON.stringify(categorias));
        requestData = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        endpoint = "/api/flota/basico";
        const { documentos, fechasVigencia, ...vehiculoBasico } = data;

        requestData = vehiculoBasico;
        headers["Content-Type"] = "application/json";
      }

      setProcesamiento(initialProcesamientoState);

      const response = await apiClient.post<ApiResponse<Vehiculo>>(
        endpoint,
        requestData,
        { headers },
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Error al crear vehículo");
      }
    } catch (err: any) {
      console.log(err);
      // Definir un mensaje de error predeterminado
      let errorTitle = "Error al crear vehículo";
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
                linea: "Línea del vehículo",
                color: "Color del vehículo",
                clase_vehiculo: "Clase del vehículo",
                modelo: "Modelo",
                documentos: "Documentos",
                fechasVigencia: "Fechas de vigencia",
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
                  } else if (error.mensaje.includes("vigencia")) {
                    customMessage = `La fecha de vigencia para ${fieldLabel.toLowerCase()} es inválida o está vencida`;
                  } else if (error.mensaje.includes("required")) {
                    customMessage = `${fieldLabel} es requerido`;
                  }

                  addToast({
                    title: `Error en ${fieldLabel}`,
                    description: customMessage,
                    color: "danger",
                  });
                },
              );

              // Actualizar el mensaje de error general si se mostraron errores específicos
              if (errorShown) {
                setError("Error de validación en los campos");
                throw new Error("Error de validación en los campos");
              }
            }

            // Verificar errores específicos comunes en el mensaje
            if (
              errorDescription.includes("unique") ||
              errorDescription.includes("duplicado")
            ) {
              errorTitle = "Datos duplicados";
              errorDescription =
                "Algunos de los datos ingresados ya existen en el sistema.";

              if (errorDescription.toLowerCase().includes("placa")) {
                errorTitle = "Placa duplicada";
                errorDescription = "Ya existe un vehículo con esta placa.";
              }
            }

            // Errores específicos de documentos
            if (errorDescription.includes("documento")) {
              errorTitle = "Error en documentos";
              if (errorDescription.includes("vigencia")) {
                errorDescription =
                  "Una o más fechas de vigencia de los documentos son inválidas.";
              } else if (errorDescription.includes("obligatorio")) {
                errorDescription = "Falta documentación obligatoria.";
              }
            }
            break;

          case 401: // Unauthorized
            errorTitle = "No autorizado";
            errorDescription = "No tienes permisos para realizar esta acción.";
            break;

          case 403: // Forbidden
            errorTitle = "Acceso denegado";
            errorDescription =
              "No tienes los permisos necesarios para crear vehículos.";
            break;

          case 413: // Payload Too Large
            errorTitle = "Archivos demasiado grandes";
            errorDescription =
              "Uno o más archivos exceden el tamaño máximo permitido.";
            break;

          case 422: // Unprocessable Entity
            errorTitle = "Datos no procesables";
            errorDescription =
              "Los datos enviados no pudieron ser procesados. Verifica el formato de los archivos.";
            break;

          case 500: // Internal Server Error
            errorTitle = "Error del servidor";
            // Usar el mensaje del servidor si está disponible, sino mensaje genérico
            errorDescription =
              err.response.data?.message ||
              "Ha ocurrido un error interno en el servidor. Intenta nuevamente.";
            break;

          case 502: // Bad Gateway
          case 503: // Service Unavailable
          case 504: // Gateway Timeout
            errorTitle = "Servicio no disponible";
            errorDescription =
              "El servicio no está disponible temporalmente. Intenta nuevamente en unos minutos.";
            break;

          default:
            errorTitle = `Error ${err.response.status}`;
            errorDescription =
              err.response.data?.message || "Ha ocurrido un error inesperado.";
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
  };

  // ✅ VERSION MEJORADA para actualización de vehículo usando las funciones helper:
  const actualizarVehiculo = async (
    data: ActualizarVehiculoRequest,
  ): Promise<Vehiculo> => {
    clearError();

    try {
      const tieneDocumentos = validarDocumentos(data.documentos);

      let endpoint: string;
      let requestData: any;
      let headers: Record<string, string> = {};

      if (tieneDocumentos) {
        endpoint = `/api/flota/${data.id}`;
        const formData = new FormData();

        // Agregar datos básicos del vehículo
        Object.keys(data).forEach((key) => {
          if (
            key !== "documentos" &&
            key !== "fechasVigencia" &&
            key !== "id"
          ) {
            const value = data[key as keyof CrearVehiculoRequest];

            if (value !== undefined && value !== null) {
              formData.append(key, value.toString());
            }
          }
        });

        // Extraer fechas de vigencia usando función helper
        const fechasVigencia = extraerFechasVigencia(data.documentos);

        if (Object.keys(fechasVigencia).length > 0) {
          formData.append("fechasVigencia", JSON.stringify(fechasVigencia));
        }

        if (data.fechasVigencia && Object.keys(fechasVigencia).length === 0) {
          formData.append(
            "fechasVigencia",
            JSON.stringify(data.fechasVigencia),
          );
        }

        // Agregar archivos usando función helper
        const categorias = extraerCategorias(data.documentos);

        // ✅ NUEVO: Separar documentos nuevos de actualizaciones de existentes
        const documentosNuevos: string[] = [];
        const documentosActualizados: any[] = [];

        if (data.documentos) {
          Object.entries(data.documentos).forEach(([categoria, documento]) => {
            if (documento?.file) {
              // Es un documento nuevo
              formData.append("documentos", documento.file);
              documentosNuevos.push(categoria);
            } else if (documento?.tipo === "existente" && documento?.id) {
              // Es una actualización de documento existente (solo fecha de vigencia)
              documentosActualizados.push({
                id: documento.id,
                categoria,
                fecha_vigencia: documento.fecha_vigencia?.toISOString() || null,
              });
            }
          });
        }

        // ✅ Agregar metadatos sobre documentos
        formData.append("categorias", JSON.stringify(categorias));
        if (documentosActualizados.length > 0) {
          formData.append(
            "documentosActualizados",
            JSON.stringify(documentosActualizados),
          );
        }

        requestData = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        // ✅ Sin documentos - endpoint básico con PUT
        endpoint = `/api/flota/basico/${data.id}`;
        const {
          documentos,
          fechasVigencia,
          id: vehiculoId,
          ...vehiculoBasico
        } = data;

        requestData = vehiculoBasico;
        headers["Content-Type"] = "application/json";
      }

      // ✅ Usar PUT en lugar de POST para actualización
      const response = await apiClient.put<ApiResponse<Vehiculo>>(
        endpoint,
        requestData,
        { headers },
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Error al actualizar vehículo",
        );
      }
    } catch (err: any) {
      // Definir un mensaje de error predeterminado
      let errorTitle = "Error al actualizar vehículo";
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
                linea: "Línea del vehículo",
                color: "Color del vehículo",
                clase_vehiculo: "Clase del vehículo",
                modelo: "Modelo",
                documentos: "Documentos",
                fechasVigencia: "Fechas de vigencia",
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
                  } else if (error.mensaje.includes("vigencia")) {
                    customMessage = `La fecha de vigencia para ${fieldLabel.toLowerCase()} es inválida o está vencida`;
                  } else if (error.mensaje.includes("required")) {
                    customMessage = `${fieldLabel} es requerido`;
                  }

                  addToast({
                    title: `Error en ${fieldLabel}`,
                    description: customMessage,
                    color: "danger",
                  });
                },
              );

              // Actualizar el mensaje de error general si se mostraron errores específicos
              if (errorShown) {
                setError("Error de validación en los campos");
                throw new Error("Error de validación en los campos");
              }
            }

            // Verificar errores específicos comunes en el mensaje
            if (
              errorDescription.includes("unique") ||
              errorDescription.includes("duplicado")
            ) {
              errorTitle = "Datos duplicados";
              errorDescription =
                "Algunos de los datos ingresados ya existen en el sistema.";

              if (errorDescription.toLowerCase().includes("placa")) {
                errorTitle = "Placa duplicada";
                errorDescription = "Ya existe otro vehículo con esta placa.";
              }
            }

            // Errores específicos de documentos
            if (errorDescription.includes("documento")) {
              errorTitle = "Error en documentos";
              if (errorDescription.includes("vigencia")) {
                errorDescription =
                  "Una o más fechas de vigencia de los documentos son inválidas.";
              } else if (errorDescription.includes("obligatorio")) {
                errorDescription = "Falta documentación obligatoria.";
              }
            }
            break;

          case 401: // Unauthorized
            errorTitle = "No autorizado";
            errorDescription = "No tienes permisos para realizar esta acción.";
            break;

          case 403: // Forbidden
            errorTitle = "Acceso denegado";
            errorDescription =
              "No tienes los permisos necesarios para actualizar vehículos.";
            break;

          case 404: // Not Found
            errorTitle = "Vehículo no encontrado";
            errorDescription =
              "El vehículo que intentas actualizar no existe o ha sido eliminado.";
            break;

          case 409: // Conflict
            errorTitle = "Conflicto de datos";
            errorDescription =
              "Los datos que intentas actualizar entran en conflicto con información existente.";
            break;

          case 413: // Payload Too Large
            errorTitle = "Archivos demasiado grandes";
            errorDescription =
              "Uno o más archivos exceden el tamaño máximo permitido.";
            break;

          case 422: // Unprocessable Entity
            errorTitle = "Datos no procesables";
            errorDescription =
              "Los datos enviados no pudieron ser procesados. Verifica el formato de los archivos.";
            break;

          case 500: // Internal Server Error
            errorTitle = "Error del servidor";
            // Usar el mensaje del servidor si está disponible, sino mensaje genérico
            errorDescription =
              err.response.data?.message ||
              "Ha ocurrido un error interno en el servidor. Intenta nuevamente.";
            break;

          case 502: // Bad Gateway
          case 503: // Service Unavailable
          case 504: // Gateway Timeout
            errorTitle = "Servicio no disponible";
            errorDescription =
              "El servicio no está disponible temporalmente. Intenta nuevamente en unos minutos.";
            break;

          default:
            errorTitle = `Error ${err.response.status}`;
            errorDescription =
              err.response.data?.message || "Ha ocurrido un error inesperado.";
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
      console.error("Error detallado al actualizar vehículo:", err);

      // Siempre lanzamos el error, nunca retornamos null
      throw err;
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

      const handleVehiculoCreado = (
        data: CrearVehiculoConDocumentosResponse,
      ) => {
        setSocketEventLogs((prev) => [
          ...prev,
          {
            eventName: "vehiculo:creado",
            data,
            timestamp: new Date(),
          },
        ]);

        // Agregar el nuevo vehículo al estado
        setVehiculosState((prev) => ({
          ...prev,
          data: [
            { ...data.vehiculo, documentos: data.documentos },
            ...prev.data,
          ], // Agregar al inicio del array
          count: prev.count + 1,
          // Recalcular totalPages si es necesario (asumiendo un tamaño de página)
          // totalPages: Math.ceil((prev.count + 1) / pageSize),
        }));

        setCurrentVehiculo(null);
        setModalFormOpen(false);
        setProcesamiento(initialProcesamientoState);

        addToast({
          title: "Nuevo Vehículo",
          description: `Se ha creado un nuevo vehículo: ${data.vehiculo.placa}`,
          color: "success",
        });
      };

      const handleVehiculoActualizado = (data: {
        vehiculo: Vehiculo;
        documentosActualizados: Documento[];
        categoriasActualizadas: string[];
      }) => {
        setSocketEventLogs((prev) => [
          ...prev,
          {
            eventName: "vehiculo:actualizado",
            data,
            timestamp: new Date(),
          },
        ]);

        // Actualizar el vehículo específico en el estado
        setVehiculosState((prev) => ({
          ...prev,
          data: prev.data.map((vehiculo) =>
            vehiculo.id === data.vehiculo.id
              ? {
                  ...data.vehiculo,
                  documentos: (() => {
                    // Si no hay documentos existentes, usar solo los nuevos documentos actualizados
                    if (
                      !vehiculo.documentos ||
                      vehiculo.documentos.length === 0
                    ) {
                      return data.documentosActualizados;
                    }

                    // Crear un mapa de documentos actualizados por categoría para búsqueda eficiente
                    const documentosActualizadosMap = new Map(
                      data.documentosActualizados.map((doc) => [
                        doc.categoria,
                        doc,
                      ]),
                    );

                    // Actualizar documentos existentes y agregar nuevos
                    const documentosActualizados = vehiculo.documentos.map(
                      (docExistente) => {
                        const docActualizado = documentosActualizadosMap.get(
                          docExistente.categoria,
                        );

                        if (docActualizado) {
                          // Remover del mapa para evitar duplicados
                          documentosActualizadosMap.delete(
                            docExistente.categoria,
                          );

                          return docActualizado;
                        }

                        return docExistente;
                      },
                    );

                    // Agregar documentos completamente nuevos (categorías que no existían antes)
                    const documentosNuevos = Array.from(
                      documentosActualizadosMap.values(),
                    );

                    return [...documentosActualizados, ...documentosNuevos];
                  })(),
                }
              : vehiculo,
          ),
        }));

        // Limpiar estados de UI
        setCurrentVehiculo(null);
        setModalFormOpen(false);
        setProcesamiento(initialProcesamientoState);

        // Mostrar notificación de éxito
        addToast({
          title: "Vehículo Actualizado",
          description: `Se ha actualizado la información del vehículo: ${data.vehiculo.placa}`,
          color: "primary",
        });
      };

      const handleConfirmarCreacion = (data: {
        camposEditables: string[];
        datosVehiculo: Vehiculo;
        progreso: number;
        mensaje: string;
        sessionId: string;
        socketId: string | unknown;
        opciones: {
          confirmar: boolean;
          editar: boolean;
          cancelar: boolean;
        };
      }) => {
        setSocketEventLogs((prev) => [
          ...prev,
          {
            eventName: "vehiculo:confirmacion:requerida",
            data,
            timestamp: new Date(),
          },
        ]);

        setCurrentVehiculo(data.datosVehiculo);
        setProcesamiento((prev) => ({
          ...prev,
          sessionId: data.sessionId,
          estado: "procesando",
          mensaje: data.mensaje,
          progreso: data.progreso,
        }));
      };

      const handleErrorProcesamiento = async (data: ErrorProcesamiento) => {
        setSocketEventLogs((prev) => [
          ...prev,
          {
            eventName: "vehiculo:procesamiento:error",
            data,
            timestamp: new Date(),
          },
        ]);

        // Preservar vehiculo si ya existe y el nuevo evento no lo trae
        setProcesamiento((prev) => ({
          ...prev,
          sessionId: data.sessionId,
          error: data.error,
          estado: "error",
          mensaje: data.mensaje,
          progreso: 0,
          vehiculo: data.vehiculo || prev.vehiculo,
        }));
      };

      const handleInicio = (data: any) => {
        setProcesamiento((prev) => ({
          ...prev,
          sessionId: data.sessionId,
          estado: "iniciando",
          procesados: data.procesados,
          mensaje: data.mensaje,
          progreso: data.progreso,
        }));
      };

      const handleProgreso = (data: any) => {
        setProcesamiento((prev) => ({
          ...prev,
          sessionId: data.sessionId,
          estado: "procesando",
          procesados: data.procesados,
          mensaje: data.mensaje,
          progreso: data.progreso,
        }));
      };

      const handleCompletado = (data: any) => {
        setProcesamiento((prev) => ({
          ...prev,
          estado: "completado",
          progreso: 100,
          mensaje: data.mensaje,
          error: "",
        }));
      };

      // Registrar manejadores de eventos
      socketService.on("connect", handleConnect);
      socketService.on("disconnect", handleDisconnect);

      // Registrar manejadores de eventos de vehículos
      socketService.on("vehiculo:creado", handleVehiculoCreado);
      socketService.on("vehiculo:actualizado", handleVehiculoActualizado);
      socketService.on(
        "vehiculo:confirmacion:requerida",
        handleConfirmarCreacion,
      );
      socketService.on(
        "vehiculo:procesamiento:error",
        handleErrorProcesamiento,
      );
      socketService.on("vehiculo:procesamiento:inicio", handleInicio);
      socketService.on("vehiculo:procesamiento:progreso", handleProgreso);
      socketService.on("vehiculo:procesamiento:completado", handleCompletado);

      return () => {
        // Limpiar al desmontar
        socketService.off("connect");
        socketService.off("disconnect");

        // Limpiar manejadores de eventos de conductores
        socketService.off("vehiculo:creado");
        socketService.off("vehiculo:actualizado");
        socketService.off("vehiculo:confirmacion:requerida");
        socketService.off("vehiculo:procesamiento:progreso", handleProgreso);
        socketService.off(
          "vehiculo:procesamiento:completado",
          handleCompletado,
        );
        socketService.off("vehiculo:procesamiento:error");
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
    procesamiento,
    modalDetalleOpen,
    selectedVehiculoId,
    modalFormOpen,
    vehiculoParaEditar,

    setLoading,
    setProcesamiento,
    setModalDetalleOpen,
    setSelectedVehiculoId,
    setModalFormOpen,
    setVehiculoParaEditar,

    fetchVehiculos,
    getVehiculo,
    crearVehiculo,
    actualizarVehiculo,

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
