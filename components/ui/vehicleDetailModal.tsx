"use client";

import {
  DocumentTextIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, ClockIcon, EyeIcon, TruckIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Modal, ModalContent } from "@heroui/modal";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useFlota } from "@/context/FlotaContext";
import { apiClient } from "@/config/apiClient";

// Función para formatear fechas
const formatDate = (dateString: Date | string | null) => {
  if (!dateString) return "No registrada";

  const date = new Date(dateString);

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Función para verificar el estado de los documentos
const checkDocumentStatus = (date: Date | string | null) => {
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

// Función para obtener la clase de color según el estado
const getStatusColor = (status: string) => {
  switch (status) {
    case "DISPONIBLE":
      return "bg-emerald-100 text-emerald-800";
    case "NO DISPONIBLE":
      return "bg-red-100 text-red-800";
    case "MANTENIMIENTO":
      return "bg-amber-100 text-amber-800";
    case "INACTIVO":
      return "bg-gray-100 text-gray-800";
    case "VENCIDO":
      return "bg-red-100 text-red-800";
    case "PRÓXIMO":
      return "bg-amber-100 text-amber-800";
    case "VIGENTE":
      return "bg-emerald-100 text-emerald-800";
    case "NA":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

// Componente de ícono según estado
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "VENCIDO":
      return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
    case "PRÓXIMO":
      return <ClockIcon className="h-5 w-5 text-amber-600" />;
    case "VIGENTE":
      return <CheckCircleIcon className="h-5 w-5 text-emerald-600" />;
    default:
      return null;
  }
};

interface DocumentFile {
  id: string;
  document_type: string;
  s3_key: string;
  upload_date: string;
  filename: string;
}

export default function VehiculoActualDetailModal() {
  const { vehiculoActual, showDetalleModal, cerrarModales } = useFlota();
  const [activeTab, setActiveTab] = useState("info");
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    4;
    // Si el modal está abierto y estamos en la pestaña de documentos, cargar los documentos
    if (showDetalleModal && activeTab === "documents" && vehiculoActual?.id) {
      fetchDocuments();
    }
  }, [showDetalleModal, activeTab, vehiculoActual?.id]);

  const fetchDocuments = async () => {
    if (!vehiculoActual?.id) return;

    setLoading(true);
    try {
      const response = await apiClient.get(
        `/api/documentos/vehiculos/${vehiculoActual.id}`,
      );

      setDocumentFiles(response.data.data);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleViewDocument = async (s3Key: string) => {
    const url = await getPresignedUrl(s3Key);

    if (url) {
      window.open(url, "_blank");
    }
  };

  if (!vehiculoActual || !showDetalleModal) return null;

  // Prepara un array de documentos con sus estados
  const documentsBase = [
    { name: "SOAT", date: vehiculoActual.soatVencimiento, type: "SOAT" },
    {
      name: "Técnicomecánica",
      date: vehiculoActual.tecnomecanicaVencimiento,
      type: "TECNOMECANICA",
    },
    {
      name: "Tarjeta de Operación",
      date: vehiculoActual.tarjetaDeOperacionVencimiento,
      type: "TARJETA_DE_OPERACION",
    },
    {
      name: "Póliza Contractual",
      date: vehiculoActual.polizaContractualVencimiento,
      type: "POLIZA_CONTRACTUAL",
    },
    {
      name: "Póliza Extracontractual",
      date: vehiculoActual.polizaExtraContractualVencimiento,
      type: "POLIZA_EXTRACONTRACTUAL",
    },
    {
      name: "Póliza Todo Riesgo",
      date: vehiculoActual.polizaTodoRiesgoVencimiento,
      type: "POLIZA_TODO_RIESGO",
    },
    { name: "Tarjeta de Propiedad", date: null, type: "TARJETA_DE_PROPIEDAD" },
  ];

  // Enriquecer los documentos base con información de archivos si está disponible
  const documents = documentsBase.map((doc) => {
    const matchingFile = documentFiles.find(
      (file) => file.document_type === doc.type,
    );

    return {
      ...doc,
      status: checkDocumentStatus(doc.date),
      formattedDate: formatDate(doc.date),
      hasFile: !!matchingFile,
      s3Key: matchingFile?.s3_key,
      fileId: matchingFile?.id,
      filename: matchingFile?.filename,
    };
  });

  // Imágenes de galería (si existen)
  let galeria: string[] = [];

  try {
    if (vehiculoActual.galeria && vehiculoActual.galeria.length > 0) {
      galeria = vehiculoActual.galeria;
    }
  } catch (e) {
    console.error("Error al parsear la galería:", e);
  }

  const handleNavigate = async () => {
    router.push(`/actualizar/${vehiculoActual.id}`);
    cerrarModales();
  };

  return (
    <Modal isOpen={true} size="4xl" onOpenChange={cerrarModales}>
      <ModalContent className=" overflow-y-auto max-h-full">
        {(onClose) => (
          <>
            {/* Modal panel */}
            {/* Header con título y botón de cerrar */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center">
                <TruckIcon className="h-6 w-6 text-emerald-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Detalle del Vehículo:{" "}
                  <span className="font-semibold">{vehiculoActual.placa}</span>
                </h3>
              </div>
            </div>

            {/* Pestañas */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "info"
                      ? "border-b-2 border-emerald-500 text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("info")}
                >
                  Información General
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "documents"
                      ? "border-b-2 border-emerald-500 text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("documents")}
                >
                  Documentos
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "gallery"
                      ? "border-b-2 border-emerald-500 text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("gallery")}
                >
                  Galería
                </button>
              </nav>
            </div>

            {/* Contenido según pestaña */}
            <div className="p-6">
              {/* Pestaña de información general */}
              {activeTab === "info" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Datos del vehículo */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Datos del Vehículo
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Placa</p>
                        <p className="font-medium">{vehiculoActual.placa}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Estado</p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehiculoActual.estado)}`}
                        >
                          {vehiculoActual.estado}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-500">Marca</p>
                        <p>{vehiculoActual.marca}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Línea</p>
                        <p>{vehiculoActual.linea}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Modelo</p>
                        <p>{vehiculoActual.modelo}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Color</p>
                        <p>{vehiculoActual.color}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Clase</p>
                        <p>{vehiculoActual.claseVehiculo}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Carrocería</p>
                        <p>{vehiculoActual.tipoCarroceria}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Combustible</p>
                        <p>{vehiculoActual.combustible}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kilometraje</p>
                        <p>{vehiculoActual.kilometraje || 0} km</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fecha Matrícula</p>
                        <p>{formatDate(vehiculoActual.fechaMatricula)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Datos del propietario */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Datos del Propietario
                    </h4>
                    <div className="mb-4">
                      <p className="text-gray-500 text-sm">Nombre</p>
                      <p className="font-medium">
                        {vehiculoActual.propietarioNombre}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Identificación</p>
                      <p>{vehiculoActual.propietarioIdentificacion}</p>
                    </div>
                  </div>

                  {/* Números de Identificación */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Números de Identificación
                    </h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Número de Motor</p>
                        <p className="font-mono">
                          {vehiculoActual.numeroMotor}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">VIN</p>
                        <p className="font-mono">{vehiculoActual.vin}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Número de Serie</p>
                        <p className="font-mono">
                          {vehiculoActual.numeroSerie}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Número de Chasis</p>
                        <p className="font-mono">
                          {vehiculoActual.numeroChasis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Información Adicional
                    </h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Fecha de Registro</p>
                        <p>
                          {new Date(
                            vehiculoActual.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Última Actualización</p>
                        <p>
                          {new Date(
                            vehiculoActual.updatedAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña de documentos */}
              {activeTab === "documents" && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Documentos y Fechas de Vencimiento
                  </h4>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-emerald-500" />
                      <p className="mt-2 text-gray-600">
                        Cargando documentos...
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {documents.map((doc, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-md flex items-start"
                        >
                          <div className="flex-shrink-0 mr-3">
                            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">
                              {doc.name}
                            </h5>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-gray-500">
                                Vencimiento: {doc.formattedDate}
                              </p>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}
                              >
                                <StatusIcon status={doc.status} />
                                <span className="ml-1">{doc.status}</span>
                              </span>
                            </div>
                            {doc.hasFile && (
                              <div className="mt-2 flex space-x-2">
                                <button
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs rounded-md bg-white hover:bg-gray-50 text-gray-700"
                                  onClick={() => handleViewDocument(doc.s3Key!)}
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Ver
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                      onPress={handleNavigate}
                    >
                      Actualizar Documentos
                    </Button>
                  </div>
                </div>
              )}

              {/* Pestaña de galería */}
              {activeTab === "gallery" && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Galería de Imágenes
                  </h4>

                  {Array.isArray(galeria) && galeria.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {galeria.map((imagen: string, index: number) => (
                        <div
                          key={index}
                          className="aspect-square bg-gray-100 rounded-md overflow-hidden"
                        >
                          <Image
                            alt={`Imagen ${index + 1} de ${vehiculoActual.placa}`}
                            className="w-full h-full object-cover"
                            src={imagen}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      {/* <PhotographIcon className="h-12 w-12 text-gray-300 mx-auto" /> */}
                      <p className="mt-2 text-gray-500">
                        No hay imágenes disponibles
                      </p>
                      <button
                        className="mt-4 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        onClick={() => console.log("Agregar imágenes")}
                      >
                        Agregar imágenes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
