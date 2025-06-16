"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { PlusIcon } from "lucide-react";
import { Alert } from "@heroui/alert";

import {
  Vehiculo,
  useFlota,
  BusquedaParams,
  CrearVehiculoRequest,
  initialProcesamientoState,
} from "@/context/FlotaContext";
import VehiculosTable from "@/components/ui/table";
import BuscadorFiltrosVehiculo from "@/components/ui/buscadorFiltros";
import ModalForm from "@/components/ui/modalForm";
import { FilterOptions } from "@/components/ui/buscadorFiltros";
import ModalDetalleVehiculo from "@/components/ui/modalDetalle";

export default function GestionVehiculos() {
  const {
    vehiculosState,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

      console.log("Parámetros de búsqueda enviados:", params);

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
    console.log("Aplicando filtros:", nuevosFiltros);
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

  return (
    <div className="container mx-auto p-5 sm:p-10 space-y-5">
      <div className="flex gap-3 flex-col sm:flex-row w-full items-start md:items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Gestión de Vehículos</h1>
        <Button
          className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
          color="primary"
          isDisabled={loading}
          radius="sm"
          startContent={<PlusIcon />}
          onPress={abrirModalCrear}
        >
          Nuevo Vehiculo
        </Button>
      </div>

      <Alert
        className="py-2"
        color="success"
        radius="sm"
        title="Obteniendo cambios en tiempo real"
        variant="faded"
      />

      {/* Componente de búsqueda y filtros */}
      <BuscadorFiltrosVehiculo
        onFilter={handleFilter}
        onReset={handleReset}
        onSearch={handleSearch}
      />

      {/* Información detallada sobre resultados filtrados */}
      {(searchTerm || contarFiltrosActivos() > 0) && (
        <div className="space-y-2">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-blue-700 font-medium">
                  Resultados filtrados
                </span>
              </div>
              <span className="text-blue-600 text-sm">
                {contarFiltrosActivos()} filtro(s) activo(s)
              </span>
            </div>
            <div className="mt-2">
              <p className="text-blue-700 text-sm">
                Mostrando{" "}
                <span className="font-semibold">
                  {vehiculosState.data.length}
                </span>{" "}
                de <span className="font-semibold">{vehiculosState.count}</span>{" "}
                vehículo(s) total(es)
              </p>
              {generarDescripcionFiltros() && (
                <p className="text-blue-600 text-xs mt-1">
                  {generarDescripcionFiltros()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de vehiculos con paginación */}
      <VehiculosTable
        abrirModalDetalle={abrirModalDetalle}
        abrirModalEditar={abrirModalEditar}
        currentItems={vehiculosState.data}
        isLoading={loading}
        selectedIds={selectedIds}
        sortDescriptor={sortDescriptor}
        totalCount={vehiculosState.count}
        totalPages={vehiculosState.totalPages}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onSelectItem={handleSelectItem}
        // Propiedades de paginación
        currentPage={vehiculosState.currentPage}
      />

      {/* Modal de formulario (crear/editar) */}
      <ModalForm
        isOpen={modalFormOpen}
        titulo={
          vehiculoParaEditar ? "Editar Vehiculo" : "Registrar Nuevo Vehiculo"
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
