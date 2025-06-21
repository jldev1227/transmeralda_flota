"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { SearchIcon, BrushCleaning, X, UserIcon, SquareCheck, FileText, PlusCircleIcon, ArrowUpDownIcon } from "lucide-react";
import { addToast } from "@heroui/toast";

import {
  Vehiculo,
  useFlota,
  BusquedaParams,
  CrearVehiculoRequest,
  initialProcesamientoState,
} from "@/context/FlotaContext";
import ModalForm from "@/components/ui/modalForm";
import { FilterOptions } from "@/components/ui/buscadorFiltros";
import ModalDetalleVehiculo from "@/components/ui/modalDetalle";
import { apiClient } from "@/config/apiClient";
import { Alert } from "@heroui/alert";
import { useMediaQuery } from "react-responsive";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { RadioGroup, Radio } from "@heroui/radio";
import { LogoutButton } from "@/components/logout";
import { Link } from '@heroui/link'
import { useAuth } from "@/context/AuthContext";
import VehiculoCard from "@/components/ui/vehiculoCard";

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

  const { user } = useAuth()

  const isMobile = useMediaQuery({ maxWidth: 1024 });

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

  // Estados para búsqueda y filtros expandidos
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filtros, setFiltros] = useState<FilterOptions>({
    estados: [],
    clases: [],
    categoriasDocumentos: [],
    estadosDocumentos: [],
    fechaVencimientoDesde: undefined,
    fechaVencimientoHasta: undefined,
    ordenamiento: undefined,
    diasAlerta: undefined,
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

      // Filtros básicos de vehículos
      if (currentFiltros.estados.length > 0) {
        params.estado = currentFiltros.estados as any;
      }

      if (currentFiltros.clases.length > 0) {
        params.clase = currentFiltros.clases as any;
      }

      // ====== NUEVOS FILTROS DE DOCUMENTOS ======

      // Filtros por categorías de documentos
      if (
        currentFiltros.categoriasDocumentos &&
        currentFiltros.categoriasDocumentos.length > 0
      ) {
        params.categoriasDocumentos = currentFiltros.categoriasDocumentos;
      }

      // Filtros por estados de documentos
      if (
        currentFiltros.estadosDocumentos &&
        currentFiltros.estadosDocumentos.length > 0
      ) {
        params.estadosDocumentos = currentFiltros.estadosDocumentos;
      }

      // Filtros por fechas de vencimiento
      if (currentFiltros.fechaVencimientoDesde) {
        params.fechaVencimientoDesde = currentFiltros.fechaVencimientoDesde;
      }

      if (currentFiltros.fechaVencimientoHasta) {
        params.fechaVencimientoHasta = currentFiltros.fechaVencimientoHasta;
      }

      // Días de alerta personalizados
      if (currentFiltros.diasAlerta) {
        params.diasAlerta = currentFiltros.diasAlerta;
      }

      // Ordenamiento específico (puede sobrescribir el sort básico)
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
        }
      }

      // Realizar la búsqueda
      await fetchVehiculos(params);

      // Actualizar los estados después de la búsqueda exitosa
      if (searchTermParam !== undefined) setSearchTerm(searchTermParam);
      if (filtrosParam !== undefined) setFiltros(filtrosParam);
    } catch (error) {
      console.error("Error al cargar vehiculos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar la búsqueda
  const handleSearch = async (termino: string) => {
    await cargarVehiculos(1, termino, undefined);
  };

  // Manejar los filtros
  const handleFilter = async (nuevosFiltros: FilterOptions) => {
    await cargarVehiculos(1, undefined, nuevosFiltros);
  };

  // Manejar reset de búsqueda y filtros
  const handleReset = async () => {
    const filtrosVacios: FilterOptions = {
      estados: [],
      clases: [],
      categoriasDocumentos: [],
      estadosDocumentos: [],
      fechaVencimientoDesde: undefined,
      fechaVencimientoHasta: undefined,
      ordenamiento: undefined,
      diasAlerta: undefined,
    };

    await cargarVehiculos(1, "", filtrosVacios);
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    cargarVehiculos(page);
  };

  // Manejar la selección de vehiculos
  const handleSelectItem = (vehiculo: Vehiculo) => {
    if (selectedIds.includes(vehiculo.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== vehiculo.id));
    } else {
      setSelectedIds([...selectedIds, vehiculo.id]);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    const currentPageIds = vehiculosState.data.map((vehiculo) => vehiculo.id);

    if (selected) {
      // Agregar todos los vehículos de la página actual
      setSelectedIds((prev) => {
        const newIds = new Set([...prev, ...currentPageIds]);

        return Array.from(newIds);
      });
    } else {
      // Deseleccionar solo los vehículos de la página actual
      setSelectedIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
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

  const abrirModalEditar = (vehiculo: Vehiculo) => {
    setVehiculoParaEditar(vehiculo);
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

  // Función auxiliar para contar filtros activos
  const contarFiltrosActivos = () => {
    let count = 0;

    count += filtros.estados.length;
    count += filtros.clases.length;
    count += filtros.categoriasDocumentos?.length || 0;
    count += filtros.estadosDocumentos?.length || 0;
    if (filtros.fechaVencimientoDesde) count++;
    if (filtros.fechaVencimientoHasta) count++;
    if (filtros.ordenamiento) count++;
    if (filtros.diasAlerta) count++;

    return count;
  };

  // Función para generar descripción de filtros activos
  const generarDescripcionFiltros = () => {
    const descripciones = [];

    if (searchTerm) {
      descripciones.push(`Búsqueda: "${searchTerm}"`);
    }

    if (filtros.estados.length > 0) {
      descripciones.push(`Estados: ${filtros.estados.join(", ")}`);
    }

    if (filtros.clases.length > 0) {
      descripciones.push(`Clases: ${filtros.clases.join(", ")}`);
    }

    if (
      filtros.categoriasDocumentos &&
      filtros.categoriasDocumentos.length > 0
    ) {
      descripciones.push(
        `Documentos: ${filtros.categoriasDocumentos.length} tipo(s)`,
      );
    }

    if (filtros.estadosDocumentos && filtros.estadosDocumentos.length > 0) {
      descripciones.push(
        `Estado documentos: ${filtros.estadosDocumentos.join(", ")}`,
      );
    }

    if (filtros.fechaVencimientoDesde || filtros.fechaVencimientoHasta) {
      descripciones.push("Filtro por fechas");
    }

    if (filtros.diasAlerta) {
      descripciones.push(`Alerta: ${filtros.diasAlerta} días`);
    }

    return descripciones.join(" | ");
  };

  const handleExportZipVigencias = async () => {
    try {
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

  return (
    <div className="flex h-screen relative overflow-hidden">
      <div
        aria-modal="true"
        className="absolute lg:relative z-50 w-full lg:max-w-[30rem] 2xl:max-w-[32rem] animate-bottomToTop"
        role="dialog"
      >
        <div className="bg-white p-3 md:px-4 border-b flex items-center justify-between sticky top-0">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold">Gestion de Flota</h2>
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

        {/* Panel content with scrolling */}
        <div className="bg-white h-[calc(100vh-56px)] relative flex flex-col overflow-y-auto">
          {/* Filters */}
          <div className="p-4 md:p-4">
            <div className="mb-3">
              <h3 className="font-semibold mb-4">Filtros y Busqueda</h3>
              <form
                autoComplete="off"
                className="grid grid-cols-1 gap-3 md:gap-4"
                onSubmit={(e) => e.preventDefault()}
              >
                {/* Busqueda */}
                <div>
                  <Input startContent={<SearchIcon className="text-gray-300" />} radius="sm" type="text" placeholder="Busca por placa, marca, modelo, línea o propietario..." />
                </div>

                {/* Clase Vehiculo */}
                <div className="space-y-4">
                  <label className="font-semibold" htmlFor="clase_vehiculo">Clase de vehículo</label>
                  <RadioGroup id="clase_vehiculo" size="sm" color="success">
                    <Radio value="Camioneta">Camioneta</Radio>
                    <Radio value="Bus">Bus</Radio>
                    <Radio value="Buseta">Buseta</Radio>
                    <Radio value="Microbus">Microbus</Radio>
                  </RadioGroup>
                </div>

                {/* Estado Documentos */}
                <div className="space-y-4">
                  <label className="font-semibold" htmlFor="documentos">Estado Documentos</label>
                  <RadioGroup id="documentos" size="sm" color="success">
                    <Radio value="vencidos">Vencidos</Radio>
                    <Radio value="por vencer">Por vencer</Radio>
                    <Radio value="sin documentos">Sin documentos</Radio>
                    <Radio value="vigentes">Vigentes</Radio>
                  </RadioGroup>
                </div>

                {/* Estado */}
                <div className="space-y-4">
                  <label className="font-semibold" htmlFor="estados">Estado</label>
                  <RadioGroup id="estados" size="sm" color="success">
                    <Radio value="servicio">En servicio</Radio>
                    <Radio value="disponible">Disponible</Radio>
                    <Radio value="mantenimiento">En mantenimiento</Radio>
                    <Radio value="desvinculado">Desvinculado</Radio>
                  </RadioGroup>
                </div>

                <Button type="reset" startContent={<BrushCleaning />} variant="flat" radius="sm" color="primary" className="mt-5">Limpiar Filtros y Busqueda</Button>
              </form>
            </div>
          </div>

        </div>

      </div>
      {/* Header: Responsive layout for vehicle count, logout, and user name */}
      <div className="h-full w-full relative py-4 px-10 space-y-6 ">
        <div className="space-y-6">
          {/* Welcome message (for all devices) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip color="danger" content="Cerrar sesión" radius="sm">
                <div>
                  <LogoutButton />
                </div>
              </Tooltip>
              <Link href={process.env.NEXT_PUBLIC_AUTH_SYSTEM} className="inline-flex items-center gap-2 text-sm font-medium bg-white bg-opacity-90 p-2 rounded-md shadow all">
                <UserIcon className="w-5 h-5" />
                Bienvenido! {user?.nombre}
              </Link>
            </div>
            <div className="flex items-center gap-5">
              <p className="text-foreground-500">{selectedIds.length} seleccionados</p>
              <Button startContent={<SquareCheck className="w-6 h-6" />} variant="flat" radius="sm" color="primary">Activar selección</Button>
              <Button startContent={<FileText className="w-6 h-6" />} variant="flat" radius="sm" color="warning">Exportar reportes vigencias</Button>
              <Button onPress={abrirModalCrear} startContent={<PlusCircleIcon className="w-6 h-6" />} variant="flat" radius="sm" color="success">Nuevo vehículo</Button>
            </div>
          </div>

          {/* Graph de estados */}
          <div className="flex items-center justify-between gap-5">
            <div className="w-full bg-success-50 p-2.5 rounded-md">
              <p className="items-center justify-center text-success text-center">En servicio ({vehiculosState.data.filter(vehiculo => vehiculo.estado.toLowerCase() === 'servicio').length})</p>
            </div>
            <div className="w-full bg-danger-50 p-2.5 rounded-md">
              <p className="items-center justify-center text-danger text-center">Disponible ({vehiculosState.data.filter(vehiculo => vehiculo.estado.toLowerCase() === 'disponible').length})</p>
            </div>
            <div className="w-full bg-primary-50 p-2.5 rounded-md">
              <p className="items-center justify-center text-primary text-center">En mantenimiento ({vehiculosState.data.filter(vehiculo => vehiculo.estado.toLowerCase() === 'mantenimiento').length})</p>
            </div>
            <div className="w-full bg-gray-100 p-2.5 rounded-md">
              <p className="items-center justify-center text-foreground-400 text-center">Desvinculados ({vehiculosState.data.filter(vehiculo => vehiculo.estado.toLowerCase() === 'desvinculado').length})</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-foreground-500">Mostrando ({vehiculosState.count} vehículos)</p>
            <div className="flex items-center gap-3">
              <p className="text-foreground-500">Ordenar</p>
              <Button isIconOnly variant="light">
                <ArrowUpDownIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Listado de vehiculos */}
          <div
            className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5"
            style={{ maxHeight: "75vh", overflowY: "auto" }}
          >
            {vehiculosState.data.length > 0 ? (
              vehiculosState.data.map(vehiculo => (
                <VehiculoCard key={vehiculo.id} item={vehiculo} onPress={abrirModalDetalle} />
              ))
            ) : (
              <p>No hay vehiculos registrados aun</p>
            )}
          </div>
        </div>
      </div>

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
