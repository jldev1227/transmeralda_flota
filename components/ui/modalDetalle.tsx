import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import {
  Truck,
  Calendar,
  Car,
  PenTool,
  ShieldCheck,
  Edit,
  User,
  Gauge,
  MapPin,
  Fuel,
  FileText,
} from "lucide-react";
import Image from "next/image";

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

interface ModalDetalleVehiculoProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculo: Vehiculo | null;
  onEdit?: () => void;
}

// Función para obtener el color de estado del vehículo
const getEstadoColor = (estado: string) => {
  switch (estado?.toLowerCase()) {
    case "activo":
      return { badge: "bg-green-100 text-green-800" };
    case "inactivo":
      return { badge: "bg-gray-100 text-gray-800" };
    case "en mantenimiento":
      return { badge: "bg-yellow-100 text-yellow-800" };
    case "fuera de servicio":
      return { badge: "bg-red-100 text-red-800" };
    default:
      return { badge: "bg-blue-100 text-blue-800" };
  }
};

// Función para obtener etiqueta de estado
const getEstadoLabel = (estado: string) => {
  return estado?.charAt(0).toUpperCase() + estado?.slice(1) || "Desconocido";
};

const ModalDetalleVehiculo: React.FC<ModalDetalleVehiculoProps> = ({
  isOpen,
  onClose,
  vehiculo,
  onEdit,
}) => {
  if (!vehiculo) return null;

  const estadoColor = getEstadoColor(vehiculo.estado);

  // Función para formatear fecha YYYY-MM-DD a formato legible
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "No especificada";

    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Función para formatear valores monetarios
  const formatearDinero = (valor?: number) => {
    if (!valor && valor !== 0) return "No especificado";

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Función para formatear el kilometraje
  const formatearKilometraje = (km?: number) => {
    if (!km && km !== 0) return "No registrado";

    return `${new Intl.NumberFormat("es-CO").format(km)} km`;
  };

  // Función para verificar si una póliza está vencida
  const estaVencida = (fecha?: string) => {
    if (!fecha) return false;
    const hoy = new Date();
    const fechaVencimiento = new Date(fecha);

    return fechaVencimiento < hoy;
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">Detalle del Vehículo</h3>
              </div>
              <Badge className={`${estadoColor.badge} px-3 py-1`}>
                {getEstadoLabel(vehiculo.estado)}
              </Badge>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-6">
                {/* Encabezado con la información principal */}
                <div className="flex flex-col items-center md:flex-row border-b pb-6">
                  <div className="mb-4 md:mb-0 md:mr-6">
                    <Image
                      alt={`${vehiculo.placa} ${vehiculo.modelo}`}
                      className="h-48 w-48 rounded-full mr-3"
                      height={200}
                      src={`/assets/${vehiculo.clase_vehiculo.toLowerCase() === "CAMIONETA" ? "car.jpg" : "bus.jpg"}`}
                      width={200}
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {vehiculo.marca} {vehiculo.linea}
                    </h2>
                    <p className="text-md text-gray-600 mb-2">
                      Placa: <strong>{vehiculo.placa}</strong> | Modelo:{" "}
                      {vehiculo.modelo}
                    </p>
                    <div className="flex flex-col md:flex-row md:items-center text-sm text-gray-500 space-y-1 md:space-y-0 md:space-x-4">
                      <span className="flex items-center capitalize">
                        <Truck className="h-4 w-4 mr-1" />
                        {vehiculo.clase_vehiculo}
                      </span>
                      <span className="flex items-center">
                        <Gauge className="h-4 w-4 mr-1" />
                        {formatearKilometraje(vehiculo.kilometraje)}
                      </span>
                      <span className="flex items-center">
                        <Fuel className="h-4 w-4 mr-1" />
                        {vehiculo.combustible || "No especificado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenedor de columnas para la información detallada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna izquierda */}
                  <div className="space-y-6">
                    {/* Información básica */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 flex items-center border-b pb-2">
                        <Car className="h-4 w-4 mr-2 text-gray-500" />
                        Información Básica
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="font-medium w-28">Placa:</span>
                          <span>{vehiculo.placa}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Marca:</span>
                          <span>{vehiculo.marca}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Línea:</span>
                          <span>{vehiculo.linea}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Modelo:</span>
                          <span>{vehiculo.modelo}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Color:</span>
                          <span>{vehiculo.color}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Clase:</span>
                          <span>{vehiculo.clase_vehiculo}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Carrocería:</span>
                          <span>
                            {vehiculo.tipo_carroceria || "No especificada"}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Información técnica */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 flex items-center border-b pb-2">
                        <PenTool className="h-4 w-4 mr-2 text-gray-500" />
                        Información Técnica
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="font-medium w-28">VIN:</span>
                          <span>{vehiculo.vin || "No registrado"}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">No. Motor:</span>
                          <span>
                            {vehiculo.numero_motor || "No registrado"}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">No. Chasis:</span>
                          <span>
                            {vehiculo.numero_chasis || "No registrado"}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">No. Serie:</span>
                          <span>
                            {vehiculo.numero_serie || "No registrado"}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Combustible:</span>
                          <span>
                            {vehiculo.combustible || "No especificado"}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Kilometraje:</span>
                          <span>
                            {formatearKilometraje(vehiculo.kilometraje)}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Información de ubicación */}
                    {(vehiculo.latitud || vehiculo.longitud) && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-semibold mb-3 flex items-center border-b pb-2">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          Ubicación Actual
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <span className="font-medium w-28">Latitud:</span>
                            <span>{vehiculo.latitud || "No disponible"}</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-medium w-28">Longitud:</span>
                            <span>{vehiculo.longitud || "No disponible"}</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Columna derecha */}
                  <div className="space-y-6">
                    {/* Información del propietario */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 flex items-center border-b pb-2">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        Propietario
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="font-medium w-28">Nombre:</span>
                          <span>
                            {vehiculo.propietario_nombre || "No registrado"}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">
                            Identificación:
                          </span>
                          <span>
                            {vehiculo.propietario_identificacion ||
                              "No registrado"}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Información de documentos y vencimientos */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 flex items-center border-b pb-2">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        Documentos y Vencimientos
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="font-medium w-28">
                            Fecha Matrícula:
                          </span>
                          <span>{formatearFecha(vehiculo.fechaMatricula)}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">SOAT:</span>
                          <span
                            className={
                              estaVencida(vehiculo.soat_vencimiento)
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {formatearFecha(vehiculo.soat_vencimiento)}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">
                            Tecno-mecánica:
                          </span>
                          <span
                            className={
                              estaVencida(vehiculo.tecnomecanica_vencimiento)
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {formatearFecha(vehiculo.tecnomecanica_vencimiento)}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Tarjeta Op.:</span>
                          <span
                            className={
                              estaVencida(
                                vehiculo.tarjeta_de_operacion_vencimiento,
                              )
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {formatearFecha(
                              vehiculo.tarjeta_de_operacion_vencimiento,
                            )}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Información de pólizas */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 flex items-center border-b pb-2">
                        <ShieldCheck className="h-4 w-4 mr-2 text-gray-500" />
                        Pólizas
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="font-medium w-28">Contractual:</span>
                          <span
                            className={
                              estaVencida(
                                vehiculo.poliza_contractual_vencimiento,
                              )
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {formatearFecha(
                              vehiculo.poliza_contractual_vencimiento,
                            )}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">
                            Extra Contractual:
                          </span>
                          <span
                            className={
                              estaVencida(
                                vehiculo.poliza_extra_contractual_vencimiento,
                              )
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {formatearFecha(
                              vehiculo.poliza_extra_contractual_vencimiento,
                            )}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-28">Todo Riesgo:</span>
                          <span
                            className={
                              estaVencida(
                                vehiculo.poliza_todo_riesgo_vencimiento,
                              )
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {formatearFecha(
                              vehiculo.poliza_todo_riesgo_vencimiento,
                            )}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold mb-3 flex items-center border-b pb-2">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    Registro en el Sistema
                  </h4>
                  <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <li className="flex items-start">
                      <span className="font-medium w-28">Creado el:</span>
                      <span>
                        {vehiculo.createdAt
                          ? new Date(vehiculo.createdAt).toLocaleString("es-CO")
                          : "No disponible"}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium w-28">Actualizado:</span>
                      <span>
                        {vehiculo.updatedAt
                          ? new Date(vehiculo.updatedAt).toLocaleString("es-CO")
                          : "No disponible"}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium w-28">Estado:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${estadoColor.badge}`}
                      >
                        {getEstadoLabel(vehiculo.estado)}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium w-28">Conductor ID:</span>
                      <span>{vehiculo.conductor_id || "No asignado"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <div className="flex space-x-2">
                <Button
                  color="danger"
                  radius="sm"
                  variant="light"
                  onPress={onClose}
                >
                  Cerrar
                </Button>

                {/* Botón de editar */}
                {onEdit && (
                  <Button
                    color="primary"
                    radius="sm"
                    startContent={<Edit className="h-4 w-4" />}
                    variant="solid"
                    onPress={onEdit}
                  >
                    Editar Vehículo
                  </Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalDetalleVehiculo;
