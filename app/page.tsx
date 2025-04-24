"use client";

import React from "react";
import {
  BanIcon,
  CheckCircleIcon,
  CircleAlert,
  ClockIcon,
  HammerIcon,
  PlusIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";

import { SearchIcon } from "@/components/icons";
import { useFlota } from "@/context/FlotaContext";
import VehiculoCard from "@/components/vehiculoCard";

// Función para verificar el estado de documentos
const checkDocumentStatus = (date: string) => {
  if (!date) return "NA";
  const today = new Date();
  const expiryDate = new Date(date);
  const thirtyDaysFromNow = new Date();

  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (expiryDate < today) {
    return "VENCIDO";
  } else if (expiryDate <= thirtyDaysFromNow) {
    return "PRÓXIMO";
  } else {
    return "VIGENTE";
  }
};

export default function Dashboard() {
  const {
    vehiculos,
    vehiculosFiltrados,
    filtros,
    setFiltros,
    socketConnected,
    abrirModalDetalle,
    resetearFiltros,
  } = useFlota();

  return (
    <div className="flex-grow px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Vehiculos</h1>
          <Link
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
            href={"agregar"}
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nuevo Vehículo</span>
          </Link>
        </div>

        {/* Resumen de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`select-none bg-white shadow rounded-lg p-4`}
            role="button"
            onClick={resetearFiltros}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-md bg-emerald-100 text-emerald-600">
                <TruckIcon className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Vehículos
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {vehiculos.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div
            className={`select-none bg-white shadow rounded-lg p-4 border ${filtros.estado === "DISPONIBLE" ? "border-emerald-400" : ""} transition-all animate-ease-in-out`}
            role="button"
            onClick={() => {
              if (filtros.estado === "DISPONIBLE") {
                setFiltros({
                  ...filtros,
                  estado: "",
                });
              } else {
                setFiltros({
                  ...filtros,
                  estado: "DISPONIBLE",
                });
              }
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-md bg-emerald-100 text-emerald-600">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Disponibles
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {vehiculos.filter((v) => v.estado === "DISPONIBLE").length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div
            className={`select-none bg-white shadow rounded-lg p-4 border ${filtros.estado === "MANTENIMIENTO" ? "border-primary-400" : ""} transition-all animate-ease-in-out`}
            role="button"
            onClick={() => {
              if (filtros.estado === "MANTENIMIENTO") {
                setFiltros({
                  ...filtros,
                  estado: "",
                });
              } else {
                setFiltros({
                  ...filtros,
                  estado: "MANTENIMIENTO",
                });
              }
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-md bg-primary-100 text-primary-600">
                <HammerIcon className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En mantenimiento
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {
                      vehiculos.filter((v) => v.estado === "MANTENIMIENTO")
                        .length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div
            className={`select-none bg-white shadow rounded-lg p-4 border ${filtros.estado === "INACTIVO" ? "border-gray-400" : ""} transition-all animate-ease-in-out`}
            role="button"
            onClick={() => {
              if (filtros.estado === "INACTIVO") {
                setFiltros({
                  ...filtros,
                  estado: "",
                });
              } else {
                setFiltros({
                  ...filtros,
                  estado: "INACTIVO",
                });
              }
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-md bg-gray-100 text-gray-600">
                <BanIcon className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Inactivos
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {vehiculos.filter((v) => v.estado === "INACTIVO").length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div
            className={`select-none bg-white shadow rounded-lg p-4 border ${filtros.vencimientoProximo ? "border-amber-400" : ""} transition-all animate-ease-in-out`}
            role="button"
            onClick={() => {
              if (filtros.vencimientoProximo) {
                setFiltros({ ...filtros, vencimientoProximo: false });
              } else {
                setFiltros({ ...filtros, vencimientoProximo: true });
              }
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-md bg-amber-100 text-amber-600">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Documentos próximos a vencer
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {
                      vehiculos.filter(
                        (v) =>
                          checkDocumentStatus(v.soatVencimiento) ===
                            "PRÓXIMO" ||
                          checkDocumentStatus(v.tecnomecanicaVencimiento) ===
                            "PRÓXIMO" ||
                          checkDocumentStatus(
                            v.polizaContractualVencimiento,
                          ) === "PRÓXIMO" ||
                          checkDocumentStatus(
                            v.polizaExtraContractualVencimiento,
                          ) === "PRÓXIMO" ||
                          checkDocumentStatus(v.polizaTodoRiesgoVencimiento) ===
                            "PRÓXIMO" ||
                          checkDocumentStatus(
                            v.tarjetaDeOperacionVencimiento,
                          ) === "PRÓXIMO",
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div
            className={`select-none bg-white shadow rounded-lg p-4 border ${filtros.documentosVencidos ? "border-red-400" : ""} transition-all animate-ease-in-out`}
            role="button"
            onClick={() => {
              if (filtros.documentosVencidos) {
                setFiltros({ ...filtros, documentosVencidos: false });
              } else {
                setFiltros({ ...filtros, documentosVencidos: true });
              }
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-md bg-red-100 text-red-600">
                <CircleAlert className="h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Documentos vencidos
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {
                      vehiculos.filter(
                        (v) =>
                          checkDocumentStatus(v.soatVencimiento) ===
                            "VENCIDO" ||
                          checkDocumentStatus(v.tecnomecanicaVencimiento) ===
                            "VENCIDO" ||
                          checkDocumentStatus(
                            v.polizaContractualVencimiento,
                          ) === "VENCIDO" ||
                          checkDocumentStatus(
                            v.polizaExtraContractualVencimiento,
                          ) === "VENCIDO" ||
                          checkDocumentStatus(v.polizaTodoRiesgoVencimiento) ===
                            "VENCIDO" ||
                          checkDocumentStatus(
                            v.tarjetaDeOperacionVencimiento,
                          ) === "VENCIDO",
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Buscar por placa, marca o propietario..."
              type="text"
              value={filtros.busqueda}
              onChange={(e) =>
                setFiltros({ ...filtros, busqueda: e.target.value })
              }
            />
          </div>
        </div>

        {/* Lista de vehículos */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {socketConnected && (
            <div className="px-6 py-2 bg-green-50 text-green-700 border-b border-green-100 flex items-center text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              <span>Sincronización en tiempo real activa</span>
            </div>
          )}
          <div className="px-6 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Visualizando ({vehiculosFiltrados.length}) vehiculo
              {vehiculosFiltrados.length > 1 ? "s" : ""}
            </h3>
          </div>

          {vehiculosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {vehiculosFiltrados.map((vehiculo) => (
                <VehiculoCard
                  key={vehiculo.id}
                  vehiculo={vehiculo}
                  onPress={abrirModalDetalle}
                />
              ))}
            </div>
          ) : (
            <div className="grid place-items-center p-5">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay vehículos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron vehículos con los criterios de búsqueda
                actuales.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
