"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import {
  SearchIcon,
  BrushCleaning,
  X,
  UserIcon,
  SquareCheck,
  FileText,
  PlusCircleIcon,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { addToast } from "@heroui/toast";
import { Alert } from "@heroui/alert";
import { useMediaQuery } from "react-responsive";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";

import {
  useFlota,
  BusquedaParams,
  CrearVehiculoRequest,
  initialProcesamientoState,
  EstadoVehiculo,
  Vehiculo,
} from "@/context/FlotaContext";
import ModalForm from "@/components/ui/modalForm";
import { FilterOptions as OriginalFilterOptions } from "@/components/ui/buscadorFiltros";

// Extend FilterOptions to include 'ordenamiento'
type FilterOptions = OriginalFilterOptions & { ordenamiento?: string };
import ModalDetalleVehiculo from "@/components/ui/modalDetalle";
import { apiClient } from "@/config/apiClient";
import { LogoutButton } from "@/components/logout";

import { Link } from "@heroui/link";

import { useAuth } from "@/context/AuthContext";
import VehiculoCard from "@/components/ui/vehiculoCard";

import { Chip } from "@heroui/chip";

import { EstadoDocumentoOption } from "@/components/ui/filterSection";

interface FilterSets {
  estados: Set<string>;
  clases: Set<string>;
  categoriasDocumentos: Set<string>;
  estadosDocumentos: Set<string>;
  ordenamiento?: string;
}

const estadosDocumentos: EstadoDocumentoOption[] = [
  { key: "VIGENTE", label: "Vigente", color: "success", icon: CheckCircle },
  { key: "VENCIDO", label: "Vencido", color: "danger", icon: AlertTriangle },
  {
    key: "POR_VENCER_30",
    label: "Vence en 30 días",
    color: "warning",
    icon: Clock,
  },
  {
    key: "POR_VENCER_15",
    label: "Vence en 15 días",
    color: "warning",
    icon: Clock,
  },
  {
    key: "POR_VENCER_7",
    label: "Vence en 7 días",
    color: "danger",
    icon: AlertTriangle,
  },
  {
    key: "SIN_DOCUMENTO",
    label: "Sin documento",
    color: "default",
    icon: FileText,
  },
];

// Define categoriasDocumentos for use in renderFiltrosSeleccionados
const categoriasDocumentos = [
  { key: "SOAT", label: "SOAT" },
  { key: "TECNOMECANICA", label: "Tecnomecánica" },
  { key: "TARJETA_OPERACION", label: "Tarjeta de Operación" },
  // Agrega más categorías según tu aplicación
];

export default function GestionVehiculos() {
  const {
    vehiculosState,
    socketConnected,
    sortDescriptor,
    loading,
    modalDetalleOpen,
    modalFormOpen,
    vehiculoParaEditar,
    selectedVehiculoId,
    setModalDetalleOpen,
    setModalFormOpen,
    setVehiculoParaEditar,
    setSelectedVehiculoId,

    fetchVehiculos,
    crearVehiculo,
    actualizarVehiculo,
    handleSortChange,
    setProcesamiento,
    setLoading,
  } = useFlota();

  const { user } = useAuth();

  const isMobile = useMediaQuery({ maxWidth: 1024 });

  const [isSelect, setIsSelect] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const handleClosePanel = useCallback(() => {
    if (isPanelOpen && isMobile) {
      const panel = document.querySelector(".animate-bottomToTop");

      if (panel) {
        panel.classList.remove("animate-bottomToTop");
        panel.classList.add("animate-topToBottom");
        // Espera la duración de la animación antes de cerrar el panel
        setTimeout(() => {
          setIsPanelOpen(false);
          // Limpia la clase de animación para futuras aperturas
          panel.classList.remove("animate-topToBottom");
          panel.classList.add("animate-bottomToTop");
        }, 400); // Ajusta este valor si cambias la duración de la animación en CSS
      } else {
        setIsPanelOpen(false);
      }
    } else {
      setIsPanelOpen(true);
    }
  }, [isPanelOpen, isMobile]);

  const handleSelection = () => {
    if (selectedIds) {
      setSelectedIds([]);
    }

    setIsSelect(!isSelect);
  };

  // Estados para búsqueda y filtros expandidos
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filtros, setFiltros] = useState<FilterSets>({
    estados: new Set([]),
    clases: new Set([]),
    categoriasDocumentos: new Set([]),
    estadosDocumentos: new Set([]),
  });

  // Inicialización: cargar vehiculos
  useEffect(() => {
    cargarVehiculos();
  }, []);

  /// Función para cargar vehiculos con parámetros de búsqueda/filtros
  const cargarVehiculos = async (
    page: number = 1,
    searchTermParam?: string,
    filtrosParam?: FilterOptions,
  ) => {
    setLoading(true);

    try {
      // Usar parámetros proporcionados o valores de estado actuales
      const currentSearchTerm =
        searchTermParam !== undefined ? searchTermParam : searchTerm;
      const currentFiltros =
        filtrosParam !== undefined ? filtrosParam : filtros;

      // Construir parámetros de búsqueda básicos
      const params: BusquedaParams = {
        page,
        sort: sortDescriptor.column,
        order: sortDescriptor.direction,
      };

      // Añadir término de búsqueda
      if (currentSearchTerm) {
        params.search = currentSearchTerm;
      }

      console.log("Filtros actuales:", currentFiltros);

      // Filtros básicos de vehículos - CORREGIDO: Manejo consistente de Sets y Arrays
      if (
        currentFiltros.estados &&
        ((currentFiltros.estados instanceof Set &&
          currentFiltros.estados.size > 0) ||
          (Array.isArray(currentFiltros.estados) &&
            currentFiltros.estados.length > 0))
      ) {
        params.estado = Array.from(currentFiltros.estados) as EstadoVehiculo[];
      }

      if (
        currentFiltros.clases &&
        ((currentFiltros.clases instanceof Set &&
          currentFiltros.clases.size > 0) ||
          (Array.isArray(currentFiltros.clases) &&
            currentFiltros.clases.length > 0))
      ) {
        params.clase = Array.from(currentFiltros.clases);
      }

      // ====== FILTROS DE DOCUMENTOS CORREGIDOS ======
      if (
        currentFiltros.categoriasDocumentos &&
        ((currentFiltros.categoriasDocumentos instanceof Set &&
          currentFiltros.categoriasDocumentos.size > 0) ||
          (Array.isArray(currentFiltros.categoriasDocumentos) &&
            currentFiltros.categoriasDocumentos.length > 0))
      ) {
        params.categoriasDocumentos = Array.from(
          currentFiltros.categoriasDocumentos,
        );
      }

      if (
        currentFiltros.estadosDocumentos &&
        ((currentFiltros.estadosDocumentos instanceof Set &&
          currentFiltros.estadosDocumentos.size > 0) ||
          (Array.isArray(currentFiltros.estadosDocumentos) &&
            currentFiltros.estadosDocumentos.length > 0))
      ) {
        params.estadosDocumentos = Array.from(currentFiltros.estadosDocumentos);
      }

      // CORREGIDO: Ordenamiento específico - ahora maneja el caso donde ya existe un ordenamiento
      if (currentFiltros.ordenamiento) {
        switch (currentFiltros.ordenamiento) {
          case "FECHA_VENCIMIENTO_ASC":
            params.sort = "fecha_vencimiento_proxima";
            params.order = "ascending";
            break;
          case "FECHA_VENCIMIENTO_DESC":
            params.sort = "fecha_vencimiento_proxima";
            params.order = "descending";
            break;
          case "PLACA_ASC":
            params.sort = "placa";
            params.order = "ascending";
            break;
          case "PLACA_DESC":
            params.sort = "placa";
            params.order = "descending";
            break;
          case "FECHA_CREACION_DESC":
            params.sort = "createdAt";
            params.order = "descending";
            break;
          case "FECHA_CREACION_ASC":
            params.sort = "createdAt";
            params.order = "ascending";
            break;
          default:
            // Mantener el ordenamiento por defecto si no coincide
            break;
        }
      }

      console.log("Parámetros de búsqueda:", params);

      // Realizar la búsqueda
      await fetchVehiculos(params);

      // CORREGIDO: Actualizar los estados de manera consistente
      if (searchTermParam !== undefined) setSearchTerm(searchTermParam);
      if (filtrosParam !== undefined) {
        setFiltros((prevFiltros) => ({
          ...prevFiltros,
          estados: filtrosParam.estados
            ? new Set(filtrosParam.estados)
            : new Set(),
          clases: filtrosParam.clases
            ? new Set(filtrosParam.clases)
            : new Set(),
          categoriasDocumentos: filtrosParam.categoriasDocumentos
            ? new Set(filtrosParam.categoriasDocumentos)
            : new Set(),
          estadosDocumentos: filtrosParam.estadosDocumentos
            ? new Set(filtrosParam.estadosDocumentos)
            : new Set(),
          ordenamiento: filtrosParam.ordenamiento || prevFiltros.ordenamiento,
        }));
      }
    } catch (error) {
      console.error("Error al cargar vehiculos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEstadosChange = (values: string[]) => {
    setFiltros((prev) => ({
      ...prev,
      estados: new Set(values),
    }));
  };

  const handleClassesChange = (values: string[]) => {
    setFiltros((prev) => ({
      ...prev,
      clases: new Set(values),
    }));
  };

  const handleEstadosDocumentosChange = (values: string[]) => {
    setFiltros((prev) => ({
      ...prev,
      estadosDocumentos: new Set(values),
    }));
  };
  // Manejar la búsqueda
  const handleSearch = async (termino: string) => {
    await cargarVehiculos(1, termino, undefined);
  };

  const aplicarBusqueda = () => {
    handleSearch(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      aplicarBusqueda();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Manejar los filtros
  const handleFilter = async (nuevosFiltros: FilterOptions) => {
    await cargarVehiculos(1, undefined, nuevosFiltros);
  };

  // Ejecutar búsqueda cada vez que cambian los filtros
  useEffect(() => {
    // Evita el bucle infinito: solo llama si los filtros realmente cambian
    handleFilter({
      estados: Array.from(filtros.estados),
      clases: Array.from(filtros.clases),
      categoriasDocumentos: Array.from(filtros.categoriasDocumentos),
      estadosDocumentos: Array.from(filtros.estadosDocumentos),
      ordenamiento: filtros.ordenamiento,
    });
    // No incluyas handleFilter ni cargarVehiculos en dependencias para evitar bucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    Array.from(filtros.estados).join(","),
    Array.from(filtros.clases).join(","),
    Array.from(filtros.categoriasDocumentos).join(","),
    Array.from(filtros.estadosDocumentos).join(","),
    filtros.ordenamiento,
  ]);

  // Manejar reset de búsqueda y filtros
  const handleReset = async () => {
    const filtrosVacios: FilterOptions = {
      estados: [],
      clases: [],
      categoriasDocumentos: [],
      estadosDocumentos: [],
    };

    await cargarVehiculos(1, "", filtrosVacios);
  };

  // Manejar la selección de vehiculos
  const handleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((idSelected) => idSelected !== id));
    } else {
      console.log([...selectedIds, id]);
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = async (selected: boolean) => {
    if (selected) {
      // Seleccionar TODOS los vehículos (no solo los de la página actual)
      try {
        setLoading(true);
        // Obtener todos los IDs de vehículos desde el backend
        const response = await apiClient.get("/api/flota/basicos");

        console.log(response.data.data);
        if (response.status === 200 && Array.isArray(response.data.data)) {
          setSelectedIds(
            response.data.data.map((vehiculo: Vehiculo) => vehiculo.id),
          );
        } else {
          addToast({
            title: "Error al seleccionar todos",
            description: "No se pudieron obtener todos los vehículos.",
            color: "danger",
          });
        }
      } catch (error) {
        addToast({
          title: "Error al seleccionar todos",
          description: "No se pudieron obtener todos los vehículos.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Deseleccionar todos
      setSelectedIds([]);
    }
  };

  // Funciones para el modal de detalle
  const abrirModalDetalle = (id: string) => {
    setSelectedVehiculoId(id);
    setModalDetalleOpen(true);
  };

  // Funciones para el modal de formulario (crear/editar)
  const abrirModalCrear = () => {
    setVehiculoParaEditar(null);
    setModalFormOpen(true);
  };

  const cerrarModalForm = () => {
    setModalFormOpen(false);
    setVehiculoParaEditar(null);
    setProcesamiento(initialProcesamientoState);
  };

  const cerrarModalDetalle = () => {
    setModalDetalleOpen(false);
    setSelectedVehiculoId(null);
  };

  const limpiarFiltros = () => {
    handleReset();
    const filtrosVacios = {
      estados: [] as string[],
      clases: [] as string[],
      categoriasDocumentos: [] as string[],
      estadosDocumentos: [] as string[],
      ordenamiento: undefined,
    };

    setFiltros({
      estados: new Set<string>(),
      clases: new Set<string>(),
      categoriasDocumentos: new Set<string>(),
      estadosDocumentos: new Set<string>(),
      ordenamiento: undefined,
    });
    setSearchTerm("");
    cargarVehiculos(1, "", filtrosVacios);
  };

  // Función para guardar vehiculo (nueva o editada)
  const guardarVehiculo = async (
    vehiculoData:
      | CrearVehiculoRequest
      | (CrearVehiculoRequest & { id: string }),
  ) => {
    try {
      setLoading(true);
      if ("id" in vehiculoData && vehiculoData.id) {
        // Editar vehiculo existente
        await actualizarVehiculo(vehiculoData);
      } else {
        // Crear nuevo vehiculo
        await crearVehiculo(vehiculoData);
      }

      // Si llegamos aquí, significa que la operación fue exitosa
      // // Cerrar modal después de guardar correctamente
      // cerrarModalForm();

      // Recargar la lista de vehiculos con los filtros actuales
      await cargarVehiculos(vehiculosState.currentPage);
    } catch (error) {
      // Si hay un error, no hacemos nada aquí ya que los errores ya son manejados
      console.log(
        "Error al guardar el vehiculo, el modal permanece abierto:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportZipVigencias = async () => {
    try {
      if (!selectedIds || selectedIds.length === 0) {
        addToast({
          title: "No hay vehículos seleccionados",
          description:
            "Por favor selecciona al menos un vehículo para exportar los reportes.",
          color: "danger",
        });

        return;
      }

      // Configurar la petición para recibir blob
      const response = await apiClient.post(
        "/api/flota/reporte-vigencias",
        {
          vehiculoIds: selectedIds,
        },
        {
          responseType: "blob", // Importante: especificar que esperamos un blob
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // Verificar que la respuesta sea exitosa
      if (response.status === 200) {
        // Crear un blob con la respuesta
        const blob = new Blob([response.data], { type: "application/zip" });

        // Crear URL temporal para el blob
        const url = window.URL.createObjectURL(blob);

        // Crear elemento anchor para forzar la descarga
        const link = document.createElement("a");

        link.href = url;

        // Generar nombre del archivo con timestamp
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-");

        link.download = `reportes_vehiculos_${timestamp}.zip`;

        // Agregar al DOM temporalmente y hacer click
        document.body.appendChild(link);
        link.click();

        // Limpiar: remover el elemento y liberar la URL
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        addToast({
          title: `${selectedIds.length} reporte${selectedIds.length > 1 ? "s" : ""} descargado${selectedIds.length > 1 ? "s" : ""}`,
          description: `Descarga exitosa.`,
          color: "success",
        });
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Error al descargar reportes:", error);

      // Verificar si es un error de red o del servidor
      if (error.response) {
        // El servidor respondió con un status de error
        console.error(
          "Error del servidor:",
          error.response.status,
          error.response.data,
        );
        // toast.error(`Error del servidor: ${error.response.status}`);
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        console.error("Sin respuesta del servidor:", error.request);
        // toast.error('Sin respuesta del servidor. Verifica tu conexión.');
      } else {
        // Error en la configuración de la petición
        console.error("Error en la petición:", error.message);
        // toast.error('Error al procesar la petición');
      }
    }
  };

  // Define allowed filter keys for type safety
  type FilterKey =
    | "estados"
    | "clases"
    | "categoriasDocumentos"
    | "estadosDocumentos";

  const renderFiltrosSeleccionados = () => {
    // Agrupa los filtros por tipo
    const grupos: Record<FilterKey, string[]> = {
      estados: Array.from(filtros.estados),
      clases: Array.from(filtros.clases),
      categoriasDocumentos: Array.from(filtros.categoriasDocumentos),
      estadosDocumentos: Array.from(filtros.estadosDocumentos),
    };

    // Helper para obtener el label de cada valor según el tipo
    const getLabel = (tipo: FilterKey, valor: string) => {
      switch (tipo) {
        case "estados":
          return valor;
        case "clases":
          return valor;
        case "categoriasDocumentos": {
          const cat = categoriasDocumentos.find((c) => c.key === valor);

          return cat?.label || valor;
        }
        case "estadosDocumentos": {
          const est = estadosDocumentos.find((e) => e.key === valor);

          return est?.label || valor;
        }
        default:
          return valor;
      }
    };

    // Helper para obtener el label del tipo
    const getTipoLabel = (tipo: FilterKey) => {
      switch (tipo) {
        case "estados":
          return "Estado";
        case "clases":
          return "Clase";
        case "categoriasDocumentos":
          return "Documentos";
        case "estadosDocumentos":
          return "Estado documentos";
        default:
          return tipo;
      }
    };

    // Si no hay filtros activos, no renderizar nada
    const hayFiltros = Object.values(grupos).some((arr) => arr.length > 0);

    if (!hayFiltros) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(grupos).map(([tipo, valores]) =>
          valores.length > 0 ? (
            <Chip
              key={tipo}
              color="primary"
              variant="flat"
              onClose={() => {
                setFiltros((prev) => ({
                  ...prev,
                  [tipo]: new Set<string>(),
                }));
              }}
            >
              <span>
                {getTipoLabel(tipo as FilterKey)}:{" "}
                {valores.map((valor, idx) => (
                  <span key={valor}>
                    {getLabel(tipo as FilterKey, valor)}
                    {idx < valores.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </Chip>
          ) : null,
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen relative overflow-hidden bg-gray-50">
      {/* Sidebar / Panel de filtros */}
      {(isPanelOpen || !isMobile) && (
        <aside
          aria-modal="true"
          className={`
        fixed z-40 top-0 left-0 w-full h-full bg-white shadow-lg transition-transform duration-400
        lg:static lg:w-[28rem] 2xl:w-[30rem] lg:h-auto
        ${isMobile ? (isPanelOpen ? "animate-bottomToTop" : "animate-topToBottom") : ""}
        `}
          role="dialog"
          style={{
            maxWidth: isMobile ? "100vw" : undefined,
            minHeight: isMobile ? "100vh" : undefined,
          }}
        >
          <div className="bg-white p-4 border-b">
            <div className=" flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-lg md:text-xl font-bold">Gestión de Flota</h2>

              {isPanelOpen && isMobile && (
                <Button
                  isIconOnly
                  color="danger"
                  size="sm"
                  onPress={handleClosePanel}
                >
                  <X className="w-6 h-6" />
                </Button>
              )}
            </div>

            <div className="mt-4">
              {socketConnected ? (
                <Alert
                  className="py-2"
                  color="success"
                  radius="sm"
                  title="Obteniendo cambios en tiempo real"
                  variant="faded"
                />
              ) : (
                <Alert
                  className="py-2"
                  color="danger"
                  radius="sm"
                  title="Desconectado de conexión en tiempo real"
                  variant="faded"
                />
              )}
            </div>
          </div>

          <div className="bg-white h-[calc(100vh-56px)] flex flex-col overflow-y-auto">
            <div className="p-4 space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Filtros y Búsqueda</h3>
                <Input
                  className="mb-3"
                  placeholder="Busca por placa, marca, modelo, línea o propietario..."
                  radius="sm"
                  startContent={<SearchIcon className="text-gray-300" />}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyPress}
                />
              </div>
              <div>
                <label
                  className="font-semibold block mb-1"
                  htmlFor="clase_vehiculo"
                >
                  Clase de vehículo
                </label>
                <CheckboxGroup
                  className="flex flex-wrap gap-2"
                  color="success"
                  id="clase_vehiculo"
                  size="sm"
                  value={Array.from(filtros.clases)}
                  onChange={handleClassesChange}
                >
                  <Checkbox value="Camioneta">Camioneta</Checkbox>
                  <Checkbox value="Bus">Bus</Checkbox>
                  <Checkbox value="Buseta">Buseta</Checkbox>
                  <Checkbox value="Microbus">Microbus</Checkbox>
                </CheckboxGroup>
              </div>
              <div>
                <label
                  className="font-semibold block mb-1"
                  htmlFor="documentos"
                >
                  Estado Documentos
                </label>
                <CheckboxGroup
                  className="flex flex-wrap gap-2"
                  color="success"
                  id="documentos"
                  size="sm"
                  value={Array.from(filtros.estadosDocumentos)}
                  onChange={handleEstadosDocumentosChange}
                >
                  <Checkbox value="Vencidos">Vencidos</Checkbox>
                  <Checkbox value="Por vencer">Por vencer</Checkbox>
                  <Checkbox value="Sin documentos">Sin documentos</Checkbox>
                  <Checkbox value="Vigentes">Vigentes</Checkbox>
                </CheckboxGroup>
              </div>
              <div>
                <label className="font-semibold block mb-1" htmlFor="estados">
                  Estado
                </label>
                <CheckboxGroup
                  className="flex flex-wrap gap-2"
                  color="success"
                  id="estados"
                  size="sm"
                  value={Array.from(filtros.estados)}
                  onChange={handleEstadosChange}
                >
                  <Checkbox value="Servicio">En servicio</Checkbox>
                  <Checkbox value="Disponible">Disponible</Checkbox>
                  <Checkbox value="Mantenimiento">En mantenimiento</Checkbox>
                  <Checkbox value="Desvinculado">Desvinculado</Checkbox>
                </CheckboxGroup>
              </div>
              <Button
                className="mt-4 w-full"
                color="primary"
                disabled={
                  searchTerm === "" &&
                  Array.from(filtros.estados).length === 0 &&
                  Array.from(filtros.clases).length === 0 &&
                  Array.from(filtros.categoriasDocumentos).length === 0 &&
                  Array.from(filtros.estadosDocumentos).length === 0
                }
                radius="sm"
                startContent={<BrushCleaning className="w-5 h-5" />}
                variant="flat"
                onPress={limpiarFiltros}
              >
                Limpiar filtros y búsqueda
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full w-full relative py-4 px-2 sm:px-4 md:px-8 lg:px-10 space-y-6 overflow-x-hidden">
        {/* Mobile: Botón para abrir panel de filtros */}
        {!isPanelOpen && isMobile && (
          <div className="fixed bottom-4 left-10 transform -translate-x-1/2 z-50">
            <Button
              isIconOnly
              color="primary"
              radius="full"
              startContent={<SearchIcon />}
              variant="solid"
              onPress={() => setIsPanelOpen(true)}
            />
          </div>
        )}

        <div className="space-y-6">
          {/* Welcome message (for all devices) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Tooltip color="danger" content="Cerrar sesión" radius="sm">
                <div>
                  <LogoutButton />
                </div>
              </Tooltip>
              <Link
                className="inline-flex items-center gap-2 text-sm font-medium bg-white bg-opacity-90 p-2 rounded-md shadow"
                href={process.env.NEXT_PUBLIC_AUTH_SYSTEM}
              >
                <UserIcon className="w-5 h-5" />
                Bienvenido! {user?.nombre}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isSelect && (
                <p className="text-foreground-500">
                  {selectedIds.length} seleccionados
                </p>
              )}
              <Button
                color="primary"
                radius="sm"
                startContent={<SquareCheck className="w-6 h-6" />}
                variant="flat"
                onPress={handleSelection}
              >
                {isSelect ? "Desactivar selección" : "Activar selección"}
              </Button>
              <Button
                color="warning"
                radius="sm"
                startContent={<FileText className="w-6 h-6" />}
                variant="flat"
                onPress={handleExportZipVigencias}
              >
                Exportar reportes vigencias
              </Button>
              <Button
                color="success"
                radius="sm"
                startContent={<PlusCircleIcon className="w-6 h-6" />}
                variant="flat"
                onPress={abrirModalCrear}
              >
                Nuevo vehículo
              </Button>
            </div>
          </div>

          {/* Graph de estados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="select-none w-full bg-success-50 p-2.5 rounded-md">
              <p className="items-center justify-center text-success text-center">
                En servicio (
                {
                  vehiculosState.data.filter(
                    (vehiculo) => vehiculo.estado.toLowerCase() === "servicio",
                  ).length
                }
                )
              </p>
            </div>
            <div className="select-none w-full bg-danger-50 p-2.5 rounded-md">
              <p className="items-center justify-center text-danger text-center">
                Disponible (
                {
                  vehiculosState.data.filter(
                    (vehiculo) =>
                      vehiculo.estado.toLowerCase() === "disponible",
                  ).length
                }
                )
              </p>
            </div>
            <div className="select-none w-full bg-primary-50 p-2.5 rounded-md">
              <p className="items-center justify-center text-primary text-center">
                En mantenimiento (
                {
                  vehiculosState.data.filter(
                    (vehiculo) =>
                      vehiculo.estado.toLowerCase() === "mantenimiento",
                  ).length
                }
                )
              </p>
            </div>
            <div className="select-none w-full bg-gray-100 p-2.5 rounded-md">
              <p className="items-center justify-center text-foreground-400 text-center">
                Desvinculados (
                {
                  vehiculosState.data.filter(
                    (vehiculo) =>
                      vehiculo.estado.toLowerCase() === "desvinculado",
                  ).length
                }
                )
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-foreground-500">
              {(() => {
                // Define manualmente el tamaño de página
                const pageSize = 15;
                const { currentPage, count, data } = vehiculosState;

                if (count === 0) return "Mostrando 0 de 0 vehículos";
                const start = (currentPage - 1) * pageSize + 1;
                const end = start + data.length - 1;

                return `Mostrando ${start} al ${end} de ${count} vehículos`;
              })()}
            </p>

            {isSelect && (
              <Button
                color="primary"
                variant="light"
                onPress={() => handleSelectAll(isSelect)}
              >
                <p>Seleccionar todos</p>
                <SquareCheck className="text-primary" />
              </Button>
            )}
          </div>

          {/* Filtros seleccionados */}
          <div>{renderFiltrosSeleccionados()}</div>

          {/* Listado de vehiculos */}
          {loading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto" />
                <p className="mt-4 text-emerald-700">Cargando...</p>
              </div>
            </div>
          ) : (
            <div
              className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          2xl:grid-cols-5
          gap-5
          "
            >
              {vehiculosState.data.length > 0 ? (
                vehiculosState.data.map((vehiculo) => (
                  <VehiculoCard
                    key={vehiculo.id}
                    isSelect={isSelect}
                    item={vehiculo}
                    selectedIds={selectedIds}
                    onPress={abrirModalDetalle}
                    onSelect={handleSelectItem}
                  />
                ))
              ) : (
                <p>No hay vehículos registrados aún</p>
              )}
            </div>
          )}

          {/* Paginador */}
          {!loading && vehiculosState.totalPages > 1 && (
            <div className="flex justify-end py-5">
              <nav
                aria-label="Paginación"
                className="inline-flex items-center gap-1"
              >
                <Button
                  color="default"
                  disabled={vehiculosState.currentPage === 1 || loading}
                  radius="sm"
                  variant="flat"
                  onPress={() =>
                    cargarVehiculos(vehiculosState.currentPage - 1)
                  }
                >
                  Anterior
                </Button>
                {Array.from({ length: vehiculosState.totalPages }, (_, idx) => (
                  <Button
                    key={idx + 1}
                    color={
                      vehiculosState.currentPage === idx + 1
                        ? "primary"
                        : "default"
                    }
                    disabled={loading}
                    radius="sm"
                    variant={
                      vehiculosState.currentPage === idx + 1 ? "flat" : "flat"
                    }
                    onPress={() => cargarVehiculos(idx + 1)}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  color="default"
                  disabled={
                    vehiculosState.currentPage === vehiculosState.totalPages ||
                    loading
                  }
                  radius="sm"
                  variant="flat"
                  onPress={() =>
                    cargarVehiculos(vehiculosState.currentPage + 1)
                  }
                >
                  Siguiente
                </Button>
              </nav>
            </div>
          )}
        </div>
      </main>

      {/* Modal de formulario (crear/editar) */}
      <ModalForm
        isOpen={modalFormOpen}
        titulo={
          vehiculoParaEditar
            ? `Editar Vehículo ${vehiculoParaEditar.placa}`
            : "Registrar Nuevo Vehiculo"
        }
        vehiculoEditar={vehiculoParaEditar}
        onClose={cerrarModalForm}
        onSave={guardarVehiculo}
      />

      {/* Modal de detalle */}
      <ModalDetalleVehiculo
        isOpen={modalDetalleOpen}
        vehiculo={
          vehiculosState.data.find(
            (vehiculo) => vehiculo.id === selectedVehiculoId,
          ) || null
        }
        onClose={cerrarModalDetalle}
        onEdit={() => {
          setModalDetalleOpen(false);
          setModalFormOpen(true);
          setVehiculoParaEditar(
            vehiculosState.data.find(
              (vehiculo) => vehiculo.id === selectedVehiculoId,
            ) || null,
          );
        }}
      />
    </div>
  );
}
