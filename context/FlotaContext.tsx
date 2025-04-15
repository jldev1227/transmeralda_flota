"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

import { useAuth } from "./AuthContext";

import { apiClient } from "@/config/apiClient";
import socketService from "@/services/socketServices";

export interface Vehiculo {
  claseVehiculo: string;
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
  numeroChasis: string;
  numeroMotor: string;
  numeroSerie: string;
  placa: string;
  polizaContractualVencimiento: string;
  polizaExtraContractualVencimiento: string;
  polizaTodoRiesgoVencimiento: string;
  propietarioIdentificacion: string;
  propietarioNombre: string;
  propietario_id: string;
  soatVencimiento: string;
  tarjetaDeOperacionVencimiento: string;
  tecnomecanicaVencimiento: string;
  tipoCarroceria: string;
  updatedAt: string;
  vin: string;
}

export interface FiltrosVehiculos {
  conductor_id: string;
  fechaMatricula: string;
  estado: string;
  busqueda: string;
  marca: string;
  modelo: string;
  claseVehiculo: string;
  vencimientoProximo: boolean;
}

export interface SocketEventLog {
  eventName: string;
  data: any;
  timestamp: Date;
}

// Interfaz para el contexto
interface FlotaContextType {
  // Datos
  vehiculos: Vehiculo[];
  vehiculoActual: Vehiculo | null;
  loading: boolean;
  error: string | null;
  filtros: FiltrosVehiculos;
  vehiculosFiltrados: Vehiculo[];

  // Estados de modales
  showCrearModal: boolean;
  showEditarModal: boolean;
  showDetalleModal: boolean;
  sortConfig: {
    key: string;
    direction: "asc" | "desc";
  };
  // Métodos para API
  obtenerVehiculoId: (id: string) => Promise<Vehiculo | null>;
  ordenarVehiculos: (key: string, direction: "asc" | "desc") => void;
  obtenerVehiculoBasico: (id: string) => Promise<Vehiculo | null>;

  // Métodos para UI
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosVehiculos>>;
  resetearFiltros: () => void;
  abrirModalCrear: () => void;
  abrirModalEditar: (id: string) => Promise<void>;
  abrirModalDetalle: (id: string) => Promise<void>;
  cerrarModales: () => void;
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
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculoActual, setVehiculoActual] = useState<Vehiculo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Estados para Socket.IO
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [socketEventLogs, setSocketEventLogs] = useState<SocketEventLog[]>([]);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "periodo_start",
    direction: "desc",
  });

  // Estados para filtros y paginación
  const [filtros, setFiltros] = useState<FiltrosVehiculos>({
    conductor_id: "",
    fechaMatricula: "",
    estado: "",
    busqueda: "",
    marca: "",
    modelo: "",
    claseVehiculo: "",
    vencimientoProximo: false,
  });

  // Estado para manejo de modales
  const [showCrearModal, setShowCrearModal] = useState<boolean>(false);
  const [showEditarModal, setShowEditarModal] = useState<boolean>(false);
  const [showDetalleModal, setShowDetalleModal] = useState<boolean>(false);

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

      // Registrar manejadores de eventos
      socketService.on("connect", handleConnect);
      socketService.on("disconnect", handleDisconnect);

      return () => {
        // Limpiar al desmontar
        socketService.off("connect");
        socketService.off("disconnect");
      };
    }
  }, [user?.id]);

  // Función para añadir eventos al registro (log)
  const logSocketEvent = useCallback((eventName: string, data: any) => {
    setSocketEventLogs((prev) => [
      {
        eventName,
        data,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  }, []);

  // Configurar listeners para eventos de vehiculos
  useEffect(() => {
    if (!user?.id) return;

    // Manejador para nueva liquidación creada
    const handleLiquidacionCreada = (data: {
      vehiculo: Vehiculo;
      usuarioCreador: string;
    }) => {
      logSocketEvent("vehiculo_creada", data);

      // Actualizar la lista de vehiculos
      setVehiculos((prev) => {
        // Verificar si la liquidación ya existe
        const exists = prev.some((liq) => liq.id === data.vehiculo.id);

        if (exists) {
          return prev.map((liq) =>
            liq.id === data.vehiculo.id ? data.vehiculo : liq,
          );
        } else {
          return [data.vehiculo, ...prev];
        }
      });
    };

    // Limpiar al desmontar
    return () => {
      socketService.off("vehiculo_creado");
    };
  }, [user?.id, vehiculoActual, logSocketEvent]);

  // Función para limpiar el registro de eventos de socket
  const clearSocketEventLogs = useCallback(() => {
    setSocketEventLogs([]);
  }, []);

  // Obtener todas las vehiculos

  const obtenerVehiculos = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get("/api/flota");

      if (response.data.success) {
        setVehiculos(response.data.data);
      } else {
        throw new Error(response.data.message || "Error al obtener vehiculos");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error al conectar con el servidor",
      );
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Obtener una liquidación por ID
  const obtenerVehiculoId = useCallback(
    async (id: string): Promise<Vehiculo | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/api/flota/${id}`);

        if (response.data.success) {
          setVehiculoActual(response.data.vehiculo);

          return response.data.vehiculo;
        } else {
          throw new Error(
            response.data.message || "Error al obtener la liquidación",
          );
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Error al conectar con el servidor",
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const obtenerVehiculoBasico = useCallback(
    async (id: string): Promise<Vehiculo | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/api/flota/basico/${id}`);

        if (response.data.success) {
          return response.data.vehiculo;
        } else {
          throw new Error(
            response.data.message || "Error al obtener la liquidación",
          );
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Error al conectar con el servidor",
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const filtrarVehiculos = useCallback((): Vehiculo[] => {
    // Si no hay vehículos, retornar array vacío
    if (!vehiculos || vehiculos.length === 0) {
      return [];
    }

    // Filtrar los vehículos
    let filteredVehiculos = vehiculos.filter((vehiculo) => {
      // Filtro por conductor
      if (
        filtros.conductor_id &&
        vehiculo.conductor_id !== filtros.conductor_id
      ) {
        return false;
      }

      // Filtro por fecha de matrícula (mes específico)
      if (filtros.fechaMatricula && vehiculo.fechaMatricula) {
        // Asegurarse que las fechas estén en formato YYYY-MM-DD
        const fechaFiltroStr = filtros.fechaMatricula.split("T")[0]; // Remover parte de hora si existe
        const fechaVehiculoStr = vehiculo.fechaMatricula.split("T")[0];

        // Extraer año y mes directamente de los strings para evitar problemas de zona horaria
        const [anioFiltro, mesFiltro] = fechaFiltroStr
          .split("-")
          .map((num) => parseInt(num));
        const [anioVehiculo, mesVehiculo] = fechaVehiculoStr
          .split("-")
          .map((num) => parseInt(num));

        // Verificar si el vehículo pertenece al mes y año específicos
        if (mesVehiculo !== mesFiltro || anioVehiculo !== anioFiltro) {
          return false;
        }
      }

      // Filtro por estado
      if (filtros.estado && vehiculo.estado !== filtros.estado) {
        return false;
      }

      // Filtro por búsqueda (texto libre)
      if (filtros.busqueda && filtros.busqueda.trim() !== "") {
        const busqueda = filtros.busqueda.toLowerCase().trim();

        // Buscar en los campos relevantes
        const matchPlaca = vehiculo.placa
          ? vehiculo.placa.toLowerCase().includes(busqueda)
          : false;
        const matchMarca = vehiculo.marca
          ? vehiculo.marca.toLowerCase().includes(busqueda)
          : false;
        const matchModelo = vehiculo.modelo
          ? vehiculo.modelo.toLowerCase().includes(busqueda)
          : false;
        const matchColor = vehiculo.color
          ? vehiculo.color.toLowerCase().includes(busqueda)
          : false;
        const matchClase = vehiculo.claseVehiculo
          ? vehiculo.claseVehiculo.toLowerCase().includes(busqueda)
          : false;
        const matchPropietario = vehiculo.propietarioNombre
          ? vehiculo.propietarioNombre.toLowerCase().includes(busqueda)
          : false;
        const matchNumeroMotor = vehiculo.numeroMotor
          ? vehiculo.numeroMotor.toLowerCase().includes(busqueda)
          : false;
        const matchNumeroChasis = vehiculo.numeroChasis
          ? vehiculo.numeroChasis.toLowerCase().includes(busqueda)
          : false;
        const matchVIN = vehiculo.vin
          ? vehiculo.vin.toLowerCase().includes(busqueda)
          : false;

        // Si no coincide con ningún campo, filtrar
        if (
          !(
            matchPlaca ||
            matchMarca ||
            matchModelo ||
            matchColor ||
            matchClase ||
            matchPropietario ||
            matchNumeroMotor ||
            matchNumeroChasis ||
            matchVIN
          )
        ) {
          return false;
        }
      }

      // Filtros adicionales específicos para vehículos
      if (filtros.marca && vehiculo.marca !== filtros.marca) {
        return false;
      }

      if (filtros.modelo && vehiculo.modelo !== filtros.modelo) {
        return false;
      }

      if (
        filtros.claseVehiculo &&
        vehiculo.claseVehiculo !== filtros.claseVehiculo
      ) {
        return false;
      }

      // Filtro por vencimientos próximos
      if (filtros.vencimientoProximo) {
        const hoy = new Date();
        const diasLimite = 30; // Ejemplo: 30 días para considerar vencimiento próximo

        // Función para verificar si una fecha está próxima a vencer
        const esVencimientoProximo = (fechaStr: string | null): boolean => {
          if (!fechaStr) return false;

          const fechaVencimiento = new Date(fechaStr);
          const diferenciaDias = Math.floor(
            (fechaVencimiento.getTime() - hoy.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          return diferenciaDias >= 0 && diferenciaDias <= diasLimite;
        };

        // Verificar vencimientos relevantes
        const soatProximo = esVencimientoProximo(vehiculo.soatVencimiento);
        const tecnomecanicaProxima = esVencimientoProximo(
          vehiculo.tecnomecanicaVencimiento,
        );
        const todoRiesgoProximo = esVencimientoProximo(
          vehiculo.polizaTodoRiesgoVencimiento,
        );
        const tarjetaOperacionProxima = esVencimientoProximo(
          vehiculo.tarjetaDeOperacionVencimiento,
        );

        // Si ningún documento está próximo a vencer, excluir el vehículo
        if (
          !(
            soatProximo ||
            tecnomecanicaProxima ||
            todoRiesgoProximo ||
            tarjetaOperacionProxima
          )
        ) {
          return false;
        }
      }

      return true;
    });

    // Ordenar los resultados filtrados
    if (sortConfig.key) {
      filteredVehiculos.sort((a: Vehiculo, b: Vehiculo) => {
        let valorA, valorB;

        // Manejar casos especiales
        switch (sortConfig.key) {
          case "propietario":
            valorA = a.propietarioNombre || "";
            valorB = b.propietarioNombre || "";
            break;
          case "fechaMatricula":
          case "soatVencimiento":
          case "tecnomecanicaVencimiento":
          case "polizaTodoRiesgoVencimiento":
          case "tarjetaDeOperacionVencimiento":
            valorA = a[sortConfig.key] ? new Date(a[sortConfig.key]) : null;
            valorB = b[sortConfig.key] ? new Date(b[sortConfig.key]) : null;
            break;
          case "kilometraje":
            valorA = a.kilometraje || 0;
            valorB = b.kilometraje || 0;
            break;
          default:
            valorA = a[sortConfig.key as keyof Vehiculo];
            valorB = b[sortConfig.key as keyof Vehiculo];
            break;
        }

        // Manejar valores nulos o undefined
        if (valorA === null || valorA === undefined)
          return sortConfig.direction === "asc" ? -1 : 1;
        if (valorB === null || valorB === undefined)
          return sortConfig.direction === "asc" ? 1 : -1;

        // Ordenar
        if (valorA < valorB) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (valorA > valorB) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }

        return 0;
      });
    }

    return filteredVehiculos;
  }, [vehiculos, filtros, sortConfig]);

  // Define la función de ordenamiento
  const ordenarVehiculos = useCallback(
    (key: string, direction: "asc" | "desc") => {
      setSortConfig({ key, direction });
      // No necesitas hacer nada más aquí, ya que filtrarVehiculos usará el nuevo sortConfig
    },
    [],
  );

  // Resetear filtros
  const resetearFiltros = (): void => {
    setFiltros({
      conductor_id: "",
      fechaMatricula: "",
      estado: "",
      busqueda: "",
      marca: "",
      modelo: "",
      claseVehiculo: "",
      vencimientoProximo: false,
    });
  };

  // Manejo de modales
  const abrirModalCrear = (): void => {
    setVehiculoActual(null);
    setShowCrearModal(true);
  };

  const abrirModalEditar = async (id: string): Promise<void> => {
    const vehiculo = await obtenerVehiculoId(id);

    if (vehiculo) {
      setShowEditarModal(true);
    }
  };

  const abrirModalDetalle = async (id: string): Promise<void> => {
    const vehiculo = await obtenerVehiculoId(id);

    if (vehiculo) {
      setShowDetalleModal(true);
    }
  };

  const cerrarModales = (): void => {
    setShowCrearModal(false);
    setShowEditarModal(false);
    setShowDetalleModal(false);
  };

  // Cargar vehiculos al montar el componente o cuando cambie el token
  useEffect(() => {
    obtenerVehiculos();
  }, []);

  // Configurar listeners para eventos de vehiculos
  useEffect(() => {
    if (!user?.id) return;

    // Manejador para nueva liquidación creada
    const handleVehiculoCreado = (data: {
      vehiculo: Vehiculo;
      usuarioCreador: string;
    }) => {
      logSocketEvent("vehiculo_creado", data);

      // Actualizar la lista de vehiculos
      setVehiculos((prev) => {
        // Verificar si la liquidación ya existe
        const exists = prev.some((liq) => liq.id === data.vehiculo.id);

        if (exists) {
          return prev.map((liq) =>
            liq.id === data.vehiculo.id ? data.vehiculo : liq,
          );
        } else {
          return [data.vehiculo, ...prev];
        }
      });
    };

    // Manejador para liquidación actualizada
    const handleVehiculoActualizado = (data: {
      vehiculo: Vehiculo;
      usuarioActualizador: string;
      cambios: any;
    }) => {
      logSocketEvent("vehiculo_actualizado", data);

      // Actualizar la lista de liquidaciones
      setVehiculos((prev) =>
        prev.map((liq) => (liq.id === data.vehiculo.id ? data.vehiculo : liq)),
      );

      // Si la liquidación actual se está viendo/editando, actualizarla también
      if (vehiculoActual && vehiculoActual.id === data.vehiculo.id) {
        setVehiculoActual(data.vehiculo);
      }
    };

    // Manejador para liquidación eliminada
    const handleVehiculoEliminado = (data: {
      liquidacionId: string;
      usuarioEliminador: string;
    }) => {
      logSocketEvent("liquidacion_eliminada", data);

      // Eliminar la liquidación de la lista
      setVehiculos((prev) =>
        prev.filter((liq) => liq.id !== data.liquidacionId),
      );

      // Si la liquidación eliminada es la seleccionada actualmente, limpiar la selección
      if (vehiculoActual && vehiculoActual.id === data.liquidacionId) {
        setVehiculoActual(null);

        // Cerrar modales si están abiertos
        cerrarModales();
      }
    };

    // Manejador para cambio de estado
    const handleCambioEstadoVehiculo = (data: {
      liquidacionId: string;
      estadoAnterior: string;
      nuevoEstado: string;
      usuarioResponsable: string;
      comentario?: string;
    }) => {
      logSocketEvent("cambio_estado_liquidacion", data);

      // No actualizamos la liquidación aquí, ya que se actualizará con handleVehiculoActualizado
    };

    // Registrar los listeners
    socketService.on("vehiculo_creado", handleVehiculoCreado);
    socketService.on("vehiculo_actualizado", handleVehiculoActualizado);
    socketService.on("vehiculo_eliminado", handleVehiculoEliminado);
    socketService.on("cambio_estado_vehiculo", handleCambioEstadoVehiculo);

    // Limpiar al desmontar
    return () => {
      socketService.off("vehiculo_creado");
      socketService.off("vehiculo_actualizado");
      socketService.off("vehiculo_eliminado");
      socketService.off("cambio_estado_vehiculo");
    };
  }, [user?.id, vehiculoActual, logSocketEvent]);

  // Valor del contexto
  const value: FlotaContextType = {
    // Datos
    vehiculos,
    vehiculoActual,
    loading,
    error,
    filtros,
    vehiculosFiltrados: filtrarVehiculos(),

    // Estados de modales
    showCrearModal,
    showEditarModal,
    showDetalleModal,
    sortConfig,
    ordenarVehiculos,

    // Métodos para API
    obtenerVehiculoId,
    obtenerVehiculoBasico,
    // Métodos para UI
    setFiltros,
    resetearFiltros,
    abrirModalCrear,
    abrirModalEditar,
    abrirModalDetalle,
    cerrarModales,

    // socket
    socketConnected,
    socketEventLogs,
    clearSocketEventLogs,
  };

  return (
    <FlotaContext.Provider value={value}>{children}</FlotaContext.Provider>
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
