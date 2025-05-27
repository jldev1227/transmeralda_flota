"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { PlusIcon } from "lucide-react";
import { Alert } from "@heroui/alert";

import { Vehiculo, useFlota, BusquedaParams, CrearVehiculoRequest } from "@/context/FlotaContext";
import VehiculosTable from "@/components/ui/table";
import BuscadorFiltrosVehiculo from "@/components/ui/buscadorFiltros";
import ModalForm from "@/components/ui/modalForm";
import { FilterOptions } from "@/components/ui/buscadorFiltros";
import ModalDetalleVehiculo from "@/components/ui/modalDetalle";
import { useAuth } from "@/context/AuthContext";
import { LogoutButton } from "@/components/logout";
import { formatDate } from "@/helpers";

export default function GestionVehiculos() {
  const { user } = useAuth()
  const {
    vehiculosState,
    sortDescriptor,
    fetchVehiculos,
    crearVehiculo,
    actualizarVehiculoBasico,
    handleSortChange,
  } = useFlota();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filtros, setFiltros] = useState<FilterOptions>({
    sedes: [],
    tiposIdentificacion: [],
    tiposContrato: [],
    estados: [],
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Estados para los modales
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string | null>(
    null,
  );
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [vehiculoParaEditar, setVehiculoParaEditar] = useState<Vehiculo | null>(
    null,
  );

  // Inicialización: cargar conductores
  useEffect(() => {
    cargarVehiculos();
  }, []);

  /// Función para cargar conductores con parámetros de búsqueda/filtros
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

      // Construir parámetros de búsqueda
      const params: BusquedaParams = {
        page,
        sort: sortDescriptor.column,
        order: sortDescriptor.direction,
      };

      // Añadir término de búsqueda
      if (currentSearchTerm) {
        params.search = currentSearchTerm;
      }

      if (currentFiltros.estados.length > 0) {
        params.estado = currentFiltros.estados as any;
      }

      // Realizar la búsqueda
      await fetchVehiculos(params);

      // Actualizar los estados después de la búsqueda exitosa
      if (searchTermParam !== undefined) setSearchTerm(searchTermParam);
      if (filtrosParam !== undefined) setFiltros(filtrosParam);
    } catch (error) {
      console.error("Error al cargar conductores:", error);
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
    const filtrosVacios = {
      sedes: [],
      tiposIdentificacion: [],
      tiposContrato: [],
      estados: [],
    };

    await cargarVehiculos(1, "", filtrosVacios);
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    cargarVehiculos(page);
  };

  // Manejar la selección de conductores
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
  };

  const cerrarModalDetalle = () => {
    setModalDetalleOpen(false);
    setSelectedVehiculoId(null);
  };

  // Función para guardar vehiculo (nueva o editada)
  const guardarVehiculo = async (
    vehiculoData: CrearVehiculoRequest | (CrearVehiculoRequest & { id: string })
  ) => {
    try {
      setLoading(true);
      if ('id' in vehiculoData && vehiculoData.id) {
        // Editar vehiculo existente
        await actualizarVehiculoBasico(vehiculoData.id, vehiculoData);
      } else {
        // Crear nuevo vehiculo
        await crearVehiculo(vehiculoData);
      }

      // Si llegamos aquí, significa que la operación fue exitosa
      // // Cerrar modal después de guardar correctamente
      cerrarModalForm();

      // Recargar la lista de conductores con los filtros actuales
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-emerald-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-5 sm:p-10 space-y-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold shadow">
            {user.nombre.split(' ').map(name => name[0]).join('')}
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-700">{user.nombre}</h2>
            <p className="text-sm text-gray-500">{user.correo}</p>
            <p className="text-xs text-gray-400 mt-1">Último acceso: <span className="text-emerald-600">{formatDate(user.ultimo_acceso)}</span></p>
          </div>
        </div>
        <LogoutButton>Cerrar sesión</LogoutButton>
      </div>
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

      {/* Información sobre resultados filtrados */}
      {(searchTerm || Object.values(filtros).some((f) => f.length > 0)) && (
        <div className="bg-blue-50 p-3 rounded-md text-blue-700 text-sm">
          Mostrando {vehiculosState.data.length} resultado(s) de{" "}
          {vehiculosState.count} vehiculo(es) total(es)
          {searchTerm && <span> - Búsqueda: {searchTerm}</span>}
        </div>
      )}

      {/* Tabla de conductores con paginación */}
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
