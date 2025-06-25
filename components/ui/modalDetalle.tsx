import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
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
import { Chip } from "@heroui/chip";

import { apiClient } from "@/config/apiClient";
import { Documento, Vehiculo } from "@/context/FlotaContext";
import { formatearFecha, formatearKilometraje } from "@/helpers";

interface ModalDetalleVehiculoProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculo: Vehiculo | null;
  onEdit?: () => void;
}

// Función para obtener el color de estado del vehículo
const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "DESVINCULADO":
      return { badge: "bg-gray-100 text-gray-800" };
    case "DISPONIBLE":
      return { badge: "bg-danger-100 text-danger-800" };
    case "SERVICIO":
      return { badge: "bg-green-100 text-green-800" };
    case "MANTENIMIENTO":
      return { badge: "bg-warning-100 text-warning-800" };
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
    case "POLIZA_EXTRACONTRACTUAL":
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
    POLIZA_EXTRACONTRACTUAL: "Póliza Extra Contractual",
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

  // Función para verificar el estado de vigencia de una póliza
  const obtenerEstadoVigencia = (
    fecha?: string | Date,
  ): {
    msg: string;
    color:
      | "default"
      | "danger"
      | "warning"
      | "success"
      | "primary"
      | "secondary"
      | undefined;
  } => {
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
    "CERTIFICADO_GPS",
  ];

  // Agrupar y ordenar documentos por categoría según prioridad
  const documentosAgrupados =
    vehiculo.documentos?.reduce(
      (acc, doc) => {
        if (!acc[doc.categoria]) {
          acc[doc.categoria] = [];
        }
        acc[doc.categoria].push(doc);

        return acc;
      },
      {} as { [key: string]: Documento[] },
    ) || {};

  // Ordenar las entradas del objeto agrupado según la prioridad
  const documentosAgrupadosOrdenados = Object.fromEntries(
    Object.entries(documentosAgrupados).sort(
      ([a], [b]) =>
        (ordenPrioridad.indexOf(a) === -1 ? 999 : ordenPrioridad.indexOf(a)) -
        (ordenPrioridad.indexOf(b) === -1 ? 999 : ordenPrioridad.indexOf(b)),
    ),
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
      const response = await apiClient.get(
        `/api/documentos/descargar/${documento.id}`,
        {
          responseType: "blob",
          timeout: 30000, // 30 segundos
        },
      );

      if (!response.data) {
        throw new Error("No se recibieron datos del servidor");
      }

      // Crear blob y descargar
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = documento.nombre_original;
      link.style.display = "none";

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

      alert(
        `Error al descargar "${documento.nombre_original}": ${errorMessage}`,
      );
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Truck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Detalle del Vehículo
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placa: {vehiculo.placa}
                  </p>
                </div>
              </div>
              <Chip className={`${estadoColor.badge} px-4 py-2 font-medium`}>
                {getEstadoLabel(vehiculo.estado)}
              </Chip>
            </ModalHeader>

            <ModalBody className="p-0">
              {/* Encabezado horizontal mejorado */}
              <div className="flex items-start gap-8 p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                {/* Imagen grande a la izquierda */}
                <div className="flex-shrink-0 -mx-1">
                  <div className="relative">
                    <Image
                      alt={`${vehiculo.placa} ${vehiculo.modelo}`}
                      className="h-40 w-40 rounded-2xl object-cover shadow-lg border-4 border-white"
                      height={160}
                      src={`/assets/${vehiculo.clase_vehiculo.toLowerCase() === "camioneta" ? "car.jpg" : "bus.jpg"}`}
                      style={{
                        transform: "scaleX(-1)",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                      width={160}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                      <Car className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Información principal */}
                <div className="flex-1 min-w-0">
                  <div className="mb-4">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {vehiculo.marca} {vehiculo.linea}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                        Modelo {vehiculo.modelo}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {vehiculo.color}
                      </span>
                    </div>
                  </div>

                  {/* Grid de información clave horizontal */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center mb-2">
                        <Truck className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clase
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {vehiculo.clase_vehiculo}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center mb-2">
                        <Gauge className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kilometraje
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatearKilometraje(vehiculo.kilometraje)}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center mb-2">
                        <Fuel className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Combustible
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {vehiculo.combustible || "No especificado"}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Propietario
                        </span>
                      </div>
                      <p
                        className="text-sm font-semibold text-gray-900 truncate"
                        title={vehiculo.propietario_nombre || "No registrado"}
                      >
                        {vehiculo.propietario_nombre || "No registrado"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6">
                <Tabs
                  aria-label="Información del Vehículo"
                  className="w-full"
                  color="primary"
                  variant="underlined"
                >
                  <Tab key="general" title="Información General">
                    <div className="py-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna izquierda */}
                        <div className="space-y-6">
                          {/* Información básica */}
                          <Card className="shadow-sm">
                            <CardBody className="p-5">
                              <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                  <Car className="h-4 w-4 text-blue-600" />
                                </div>
                                Información Básica
                              </h4>
                              <div className="space-y-3">
                                {[
                                  { label: "Placa", value: vehiculo.placa },
                                  { label: "Marca", value: vehiculo.marca },
                                  { label: "Línea", value: vehiculo.linea },
                                  { label: "Modelo", value: vehiculo.modelo },
                                  { label: "Color", value: vehiculo.color },
                                  {
                                    label: "Clase",
                                    value: vehiculo.clase_vehiculo,
                                  },
                                  {
                                    label: "Carrocería",
                                    value:
                                      vehiculo.tipo_carroceria ||
                                      "No especificada",
                                  },
                                ].map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                                  >
                                    <span className="text-sm font-medium text-gray-600">
                                      {item.label}:
                                    </span>
                                    <span className="text-sm text-gray-900 font-medium">
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardBody>
                          </Card>

                          {/* Información técnica */}
                          <Card className="shadow-sm">
                            <CardBody className="p-5">
                              <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                                <div className="p-2 bg-green-100 rounded-lg mr-3">
                                  <PenTool className="h-4 w-4 text-green-600" />
                                </div>
                                Información Técnica
                              </h4>
                              <div className="space-y-3">
                                {[
                                  {
                                    label: "VIN",
                                    value: vehiculo.vin || "No registrado",
                                  },
                                  {
                                    label: "No. Motor",
                                    value:
                                      vehiculo.numero_motor || "No registrado",
                                  },
                                  {
                                    label: "No. Chasis",
                                    value:
                                      vehiculo.numero_chasis || "No registrado",
                                  },
                                  {
                                    label: "No. Serie",
                                    value:
                                      vehiculo.numero_serie || "No registrado",
                                  },
                                  {
                                    label: "Combustible",
                                    value:
                                      vehiculo.combustible || "No especificado",
                                  },
                                  {
                                    label: "Kilometraje",
                                    value: formatearKilometraje(
                                      vehiculo.kilometraje,
                                    ),
                                  },
                                  {
                                    label: "Fecha Matrícula",
                                    value: formatearFecha(
                                      vehiculo.fecha_matricula,
                                    ),
                                  },
                                ].map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                                  >
                                    <span className="text-sm font-medium text-gray-600">
                                      {item.label}:
                                    </span>
                                    <span className="text-sm text-gray-900 font-medium text-right">
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardBody>
                          </Card>
                        </div>

                        {/* Columna derecha */}
                        <div className="space-y-6">
                          {/* Información del propietario */}
                          <Card className="shadow-sm">
                            <CardBody className="p-5">
                              <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                  <User className="h-4 w-4 text-purple-600" />
                                </div>
                                Propietario
                              </h4>
                              <div className="space-y-3">
                                {[
                                  {
                                    label: "Nombre",
                                    value:
                                      vehiculo.propietario_nombre ||
                                      "No registrado",
                                  },
                                  {
                                    label: "Identificación",
                                    value:
                                      vehiculo.propietario_identificacion ||
                                      "No registrado",
                                  },
                                ].map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                                  >
                                    <span className="text-sm font-medium text-gray-600">
                                      {item.label}:
                                    </span>
                                    <span className="text-sm text-gray-900 font-medium">
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardBody>
                          </Card>

                          {/* Información de ubicación */}
                          {(vehiculo.latitud || vehiculo.longitud) && (
                            <Card className="shadow-sm">
                              <CardBody className="p-5">
                                <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                                    <MapPin className="h-4 w-4 text-orange-600" />
                                  </div>
                                  Ubicación Actual
                                </h4>
                                <div className="space-y-3">
                                  {[
                                    {
                                      label: "Latitud",
                                      value:
                                        vehiculo.latitud || "No disponible",
                                    },
                                    {
                                      label: "Longitud",
                                      value:
                                        vehiculo.longitud || "No disponible",
                                    },
                                  ].map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                                    >
                                      <span className="text-sm font-medium text-gray-600">
                                        {item.label}:
                                      </span>
                                      <span className="text-sm text-gray-900 font-medium">
                                        {item.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </CardBody>
                            </Card>
                          )}

                          {/* Información adicional */}
                          <Card className="shadow-sm">
                            <CardBody className="p-5">
                              <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                                <div className="p-2 bg-gray-100 rounded-lg mr-3">
                                  <Calendar className="h-4 w-4 text-gray-600" />
                                </div>
                                Registro en el Sistema
                              </h4>
                              <div className="space-y-3">
                                {[
                                  {
                                    label: "Creado el",
                                    value: vehiculo.createdAt
                                      ? new Date(
                                          vehiculo.createdAt,
                                        ).toLocaleString("es-CO")
                                      : "No disponible",
                                  },
                                  {
                                    label: "Actualizado",
                                    value: vehiculo.updatedAt
                                      ? new Date(
                                          vehiculo.updatedAt,
                                        ).toLocaleString("es-CO")
                                      : "No disponible",
                                  },
                                  {
                                    label: "Conductor",
                                    value:
                                      vehiculo.conductor_id || "No asignado",
                                  },
                                ].map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start justify-between py-2 border-b border-gray-100 last:border-b-0"
                                  >
                                    <span className="text-sm font-medium text-gray-600">
                                      {item.label}:
                                    </span>
                                    <span className="text-sm text-gray-900 font-medium text-right">
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </Tab>

                  <Tab
                    key="documentos"
                    title={`Documentos (${vehiculo.documentos?.length || 0})`}
                  >
                    <div className="py-6">
                      {vehiculo.documentos && vehiculo.documentos.length > 0 ? (
                        <div className="space-y-6">
                          {Object.entries(documentosAgrupadosOrdenados).map(
                            ([categoria, docs]) => (
                              <Card key={categoria} className="shadow-sm">
                                <CardBody className="p-5">
                                  <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                      {getDocumentIcon(categoria)}
                                    </div>
                                    {formatearCategoria(categoria)}
                                  </h4>
                                  <div className="space-y-4">
                                    {docs.map((documento) => (
                                      <div
                                        key={documento.id}
                                        className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-semibold text-gray-900 mb-3 text-base">
                                              {documento.nombre_original}
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <div className="flex items-center text-sm text-gray-600">
                                                <div className="p-1.5 bg-white rounded-lg mr-2">
                                                  <FileText className="h-3 w-3" />
                                                </div>
                                                <span>
                                                  Tamaño:{" "}
                                                  {formatearTamaño(
                                                    documento.size,
                                                  )}
                                                </span>
                                              </div>
                                              <div className="flex items-center text-sm text-gray-600">
                                                <div className="p-1.5 bg-white rounded-lg mr-2">
                                                  <Clock className="h-3 w-3" />
                                                </div>
                                                <span>
                                                  Subido:{" "}
                                                  {formatearFecha(
                                                    documento.upload_date,
                                                  )}
                                                </span>
                                              </div>
                                              <div className="flex items-center">
                                                {(() => {
                                                  const vigencia =
                                                    obtenerEstadoVigencia(
                                                      documento.fecha_vigencia,
                                                    );
                                                  let Icon;
                                                  let iconColor = "";

                                                  switch (vigencia.color) {
                                                    case "success":
                                                      Icon = CheckCircle;
                                                      iconColor =
                                                        "text-green-600";
                                                      break;
                                                    case "warning":
                                                      Icon = AlertCircle;
                                                      iconColor =
                                                        "text-yellow-600";
                                                      break;
                                                    case "danger":
                                                      Icon = AlertCircle;
                                                      iconColor =
                                                        "text-red-600";
                                                      break;
                                                    default:
                                                      Icon = AlertCircle;
                                                      iconColor =
                                                        "text-gray-400";
                                                      break;
                                                  }

                                                  return (
                                                    <>
                                                      <div className="p-1.5 bg-white rounded-lg mr-2">
                                                        <Icon
                                                          className={`h-3 w-3 ${iconColor}`}
                                                        />
                                                      </div>
                                                      <span className="text-sm text-gray-600 mr-2">
                                                        Estado:
                                                      </span>
                                                      <Chip
                                                        className="font-medium"
                                                        color={
                                                          vigencia.color
                                                            ? vigencia.color
                                                            : "default"
                                                        }
                                                        size="sm"
                                                        variant="flat"
                                                      >
                                                        {vigencia.msg}
                                                      </Chip>
                                                    </>
                                                  );
                                                })()}
                                              </div>
                                              {documento.fecha_vigencia && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                  <div className="p-1.5 bg-white rounded-lg mr-2">
                                                    <Calendar className="h-3 w-3" />
                                                  </div>
                                                  <span>
                                                    Vigencia:{" "}
                                                    {formatearFecha(
                                                      documento.fecha_vigencia,
                                                    )}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex space-x-2 ml-4 flex-shrink-0">
                                            <Button
                                              isIconOnly
                                              className="rounded-lg"
                                              color="primary"
                                              size="sm"
                                              variant="flat"
                                              onPress={() =>
                                                handleView(documento)
                                              }
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              isIconOnly
                                              className="rounded-lg"
                                              color="secondary"
                                              size="sm"
                                              variant="flat"
                                              onPress={() =>
                                                handleDownload(documento)
                                              }
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardBody>
                              </Card>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay documentos
                          </h3>
                          <p className="text-gray-500">
                            No hay documentos registrados para este vehículo
                          </p>
                        </div>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </ModalBody>

            <ModalFooter className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                Última actualización:{" "}
                {vehiculo.updatedAt
                  ? new Date(vehiculo.updatedAt).toLocaleString("es-CO")
                  : "No disponible"}
              </div>
              <div className="flex space-x-3">
                <Button
                  className="font-medium"
                  color="danger"
                  radius="lg"
                  variant="light"
                  onPress={onClose}
                >
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
