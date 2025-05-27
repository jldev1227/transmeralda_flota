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
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
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
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/config/apiClient";
import { Documento, Vehiculo } from "@/context/FlotaContext";
import { Chip } from "@heroui/chip";

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
    case "disponible":
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

// Función para obtener el icono según la categoría del documento
const getDocumentIcon = (categoria: string) => {
  switch (categoria) {
    case "SOAT":
      return <ShieldCheck className="h-4 w-4 text-blue-600" />;
    case "TECNOMECANICA":
      return <PenTool className="h-4 w-4 text-green-600" />;
    case "TARJETA_DE_PROPIEDAD":
      return <FileText className="h-4 w-4 text-purple-600" />;
    case "TARJETA_DE_OPERACION":
      return <Truck className="h-4 w-4 text-orange-600" />;
    case "POLIZA_CONTRACTUAL":
    case "POLIZA_EXTRA_CONTRACTUAL":
    case "POLIZA_TODO_RIESGO":
      return <ShieldCheck className="h-4 w-4 text-red-600" />;
    default:
      return <FileText className="h-4 w-4 text-gray-600" />;
  }
};

// Función para formatear el nombre de la categoría
const formatearCategoria = (categoria: string) => {
  const categorias: { [key: string]: string } = {
    SOAT: "SOAT",
    TECNOMECANICA: "Tecnomecánica",
    TARJETA_DE_PROPIEDAD: "Tarjeta de Propiedad",
    TARJETA_DE_OPERACION: "Tarjeta de Operación",
    POLIZA_CONTRACTUAL: "Póliza Contractual",
    POLIZA_EXTRA_CONTRACTUAL: "Póliza Extra Contractual",
    POLIZA_TODO_RIESGO: "Póliza Todo Riesgo",
  };
  return categorias[categoria] || categoria;
};

// Función para formatear el tamaño del archivo
const formatearTamaño = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  // Función para formatear el kilometraje
  const formatearKilometraje = (km?: number) => {
    if (!km && km !== 0) return "No registrado";
    return `${new Intl.NumberFormat("es-CO").format(km)} km`;
  };

  // Función para verificar el estado de vigencia de una póliza
  const obtenerEstadoVigencia = (
    fecha?: string
  ): { msg: string; color: "default" | "danger" | "warning" | "success" | "primary" | "secondary" | undefined } => {
    if (!fecha) {
      return { msg: "Sin vigencia", color: "default" };
    }
    const hoy = new Date();
    const fechaVencimiento = new Date(fecha);
    const diffMs = fechaVencimiento.getTime() - hoy.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    switch (true) {
      case diffDias < 0:
        return { msg: "Vencido", color: "danger" };
      case diffDias <= 20:
        return { msg: "Próximo a vencer", color: "warning" };
      default:
        return { msg: "Vigente", color: "success" };
    }
  };

  // Orden de prioridad de las categorías
  const ordenPrioridad = [
    "TARJETA_DE_PROPIEDAD",
    "SOAT",
    "TECNOMECANICA",
    "TARJETA_DE_OPERACION",
    "POLIZA_CONTRACTUAL",
    "POLIZA_EXTRACONTRACTUAL",
    "POLIZA_TODO_RIESGO",
    "CERTIFICADO_GPS"
  ];

  // Agrupar y ordenar documentos por categoría según prioridad
  const documentosAgrupados = vehiculo.documentos
    ?.reduce((acc, doc) => {
      if (!acc[doc.categoria]) {
        acc[doc.categoria] = [];
      }
      acc[doc.categoria].push(doc);
      return acc;
    }, {} as { [key: string]: Documento[] }) || {};

  // Ordenar las entradas del objeto agrupado según la prioridad
  const documentosAgrupadosOrdenados = Object.fromEntries(
    Object.entries(documentosAgrupados).sort(
      ([a], [b]) =>
        (ordenPrioridad.indexOf(a) === -1 ? 999 : ordenPrioridad.indexOf(a)) -
        (ordenPrioridad.indexOf(b) === -1 ? 999 : ordenPrioridad.indexOf(b))
    )
  );

  // Función para obtener URL presignada (mantén la que ya tienes)
  const getPresignedUrl = async (s3Key: string) => {
    try {
      const response = await apiClient.get(`/api/documentos/url-firma`, {
        params: { key: s3Key },
      });
      return response.data.url;
    } catch (error) {
      console.error("Error al obtener URL firmada:", error);
      return null;
    }
  };

  // Función mejorada para ver documentos
  const handleView = async (documento: Documento) => {
    try {
      const url = await getPresignedUrl(documento.s3_key);
      if (url) {
        window.open(url, "_blank");
      } else {
        // Mostrar notificación de error
        console.error("No se pudo obtener la URL del documento");
      }
    } catch (error) {
      console.error("Error al abrir documento:", error);
    }
  };

  // OPCIÓN 3: Descarga con fetch a través del backend
  const handleDownload = async (documento: Documento) => {
    try {
      const response = await apiClient.get(`/api/documentos/descargar/${documento.id}`, {
        responseType: 'blob',
        timeout: 30000, // 30 segundos
      });

      if (!response.data) {
        throw new Error("No se recibieron datos del servidor");
      }

      // Crear blob y descargar
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = documento.nombre_original;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

    } catch (error) {
      console.error("❌ Error al descargar documento:", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Error desconocido";
      alert(`Error al descargar "${documento.nombre_original}": ${errorMessage}`);
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
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
              {/* Encabezado con la información principal */}
              <div className="flex flex-col items-center md:flex-row border-b pb-6 mb-6">
                <div className="mb-4 md:mb-0 md:mr-6">
                  <Image
                    alt={`${vehiculo.placa} ${vehiculo.modelo}`}
                    className="h-32 w-32 rounded-full mr-3"
                    height={128}
                    src={`/assets/${vehiculo.clase_vehiculo.toLowerCase() === "camioneta" ? "car.jpg" : "bus.jpg"}`}
                    width={128}
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {vehiculo.marca} {vehiculo.linea}
                  </h2>
                  <p className="text-md text-gray-600 mb-2">
                    Placa: <strong>{vehiculo.placa}</strong> | Modelo: {vehiculo.modelo}
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

              <Tabs color="primary" aria-label="Información del Vehículo" className="w-full">
                <Tab key="general" title="Información General">
                  <Card shadow="sm">
                    <CardBody className="space-y-6">
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
                                <span>{vehiculo.tipo_carroceria || "No especificada"}</span>
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
                                <span>{vehiculo.numero_motor || "No registrado"}</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-medium w-28">No. Chasis:</span>
                                <span>{vehiculo.numero_chasis || "No registrado"}</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-medium w-28">No. Serie:</span>
                                <span>{vehiculo.numero_serie || "No registrado"}</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-medium w-28">Combustible:</span>
                                <span>{vehiculo.combustible || "No especificado"}</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-medium w-28">Kilometraje:</span>
                                <span>{formatearKilometraje(vehiculo.kilometraje)}</span>
                              </li>
                            </ul>
                          </div>
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
                                <span>{vehiculo.propietario_nombre || "No registrado"}</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-medium w-28">Identificación:</span>
                                <span>{vehiculo.propietario_identificacion || "No registrado"}</span>
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

                          {/* Información adicional */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-md font-semibold mb-3 flex items-center border-b pb-2">
                              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                              Registro en el Sistema
                            </h4>
                            <ul className="space-y-2">
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
                                <span className="font-medium w-28">Conductor ID:</span>
                                <span>{vehiculo.conductor_id || "No asignado"}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Tab>

                <Tab
                  key="documentos"
                  title={`Documentos (${vehiculo.documentos?.length || 0})`}
                >
                  <Card shadow="sm">
                    <CardBody className="space-y-6">
                      {vehiculo.documentos && vehiculo.documentos.length > 0 ? (
                        <div className="space-y-6">
                          {Object.entries(documentosAgrupadosOrdenados).map(([categoria, docs]) => (
                            <div key={categoria} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-md font-semibold mb-4 flex items-center border-b pb-2">
                                {getDocumentIcon(categoria)}
                                <span className="ml-2">{formatearCategoria(categoria)}</span>
                              </h4>
                              <div className="space-y-3">
                                {docs.map((documento) => (
                                  <div
                                    key={documento.id}
                                    className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="font-medium text-gray-900 mb-2">
                                          {documento.nombre_original}
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                          <div className="flex items-center">
                                            <FileText className="h-3 w-3 mr-1" />
                                            <span>Tamaño: {formatearTamaño(documento.tamaño)}</span>
                                          </div>
                                          <div className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            <span>
                                              Subido: {formatearFecha(documento.upload_date)}
                                            </span>
                                          </div>
                                          <div className="flex items-center">
                                            {documento.estado === "ACTIVO" ? (
                                              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                            ) : (
                                              <AlertCircle className="h-3 w-3 mr-1 text-red-600" />
                                            )}
                                            <span>Estado: {documento.estado}</span>
                                          </div>
                                          {documento.fecha_vigencia && (
                                            <div className="flex items-center">
                                              <Calendar className="h-3 w-3 mr-1" />
                                              <span>
                                                Vigencia: {formatearFecha(documento.fecha_vigencia)}
                                              </span>

                                              {(() => {
                                                const vigencia = obtenerEstadoVigencia(documento.fecha_vigencia);

                                                return (
                                                  <Chip
                                                    className="ml-2"
                                                    color={vigencia.color ? vigencia.color : 'default'}
                                                    variant="flat"
                                                    size="sm"
                                                  >
                                                    {vigencia.msg}
                                                  </Chip>
                                                );
                                              })()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex space-x-2 ml-4">
                                        <Button
                                          size="sm"
                                          variant="flat"
                                          color="primary"
                                          isIconOnly
                                          onPress={() => handleView(documento)}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="flat"
                                          color="secondary"
                                          isIconOnly
                                          onPress={() => handleDownload(documento)}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No hay documentos registrados para este vehículo</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Tab>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <div className="flex space-x-2">
                <Button color="danger" radius="sm" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
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