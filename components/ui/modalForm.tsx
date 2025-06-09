import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import {
  Calendar,
  Car,
  Edit,
  FileText,
  Hash,
  PenTool,
  Save,
  SaveIcon,
  TruckIcon,
  User,
  X,
} from "lucide-react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { addToast } from "@heroui/toast";
import { Alert } from "@heroui/alert";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";

import SimpleDocumentUploader from "../documentSimpleUpload";

import { formatearFecha, formatearKilometraje } from "@/helpers";
import {
  CrearVehiculoRequest,
  initialProcesamientoState,
  useFlota,
  Vehiculo,
} from "@/context/FlotaContext";
import socketService from "@/services/socketServices";

interface ModalFormVehiculoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    vehiculoData:
      | CrearVehiculoRequest
      | (CrearVehiculoRequest & { id: string }),
  ) => Promise<void>;
  vehiculoEditar?: Vehiculo | null;
  titulo?: string;
}

type VehiculoKey = keyof Vehiculo;

// Interfaz para documentos existentes
interface DocumentoExistente {
  id: string;
  categoria: string;
  nombre_original: string;
  fecha_vigencia: string | null;
  estado: string;
  s3_key: string;
  tamaño: number;
  upload_date: string;
}

// Interfaz extendida para el estado de documentos
interface DocumentoState {
  file?: File;
  fecha_vigencia?: Date;
  uploadedAt?: Date;
  // Para documentos existentes
  existente?: DocumentoExistente;
  // Flag para saber si es un documento nuevo o existente
  esNuevo?: boolean;
}

const ModalFormVehiculo: React.FC<ModalFormVehiculoProps> = ({
  isOpen,
  onClose,
  onSave,
  vehiculoEditar = null,
  titulo = "Registrar Nuevo Vehículo",
}) => {
  const { procesamiento, setProcesamiento, currentVehiculo } = useFlota();

  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState<Partial<Vehiculo>>({
    placa: "",
    marca: "",
    clase_vehiculo: "",
    color: "",
    modelo: "",
    linea: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [subirDocumentos, setSubirDocumentos] = useState(true);

  // ✅ Estado actualizado para manejar documentos existentes y nuevos
  const [documentos, setDocumentos] = useState<Record<string, DocumentoState>>(
    {},
  );

  // Estado para manejar la validación
  const [errores, setErrores] = useState<Record<string, boolean>>({
    placa: false,
    marca: false,
    clase_vehiculo: false,
    modelo: false,
    linea: false,
  });

  // Estado para errores de documentos
  const [erroresDocumentos, setErroresDocumentos] = useState<
    Record<string, boolean>
  >({});

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal para confirmaciones
  const { isOpen: isOpenConfirm, onOpen, onOpenChange } = useDisclosure();
  const [modalAction, setModalAction] = useState("");

  const editableFields = [
    "propietario_nombre",
    "propietario_identificacion",
    "modelo",
    "linea",
    "color",
    "numero_motor",
    "numero_chasis",
    "numero_serie",
    "vin",
    "fecha_matricula",
  ];

  useEffect(() => {
    if (!currentVehiculo) return;

    setFormData(currentVehiculo);
  }, [currentVehiculo]);

  // Función para manejar cambios en los inputs
  const handleInputChange = (field: string, value: string) => {
    if (!editableFields.includes(field) || !currentVehiculo) return;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Verificar si hay cambios
    const hasChangesNow =
      Object.keys(formData).some(
        (key) =>
          editableFields.includes(key) &&
          formData[key] !== currentVehiculo[key],
      ) || value !== currentVehiculo[field];

    setHasChanges(hasChangesNow);
  };

  // Función para verificar si un campo es editable
  const isFieldEditable = (field: string) => {
    return isEditing && editableFields.includes(field);
  };

  // Función para validar los datos
  const validateData = () => {
    const errors = [];

    if (!formData.propietario_nombre?.trim()) {
      errors.push("El nombre del propietario es obligatorio");
    }

    if (!formData.propietario_identificacion?.trim()) {
      errors.push("La identificación del propietario es obligatoria");
    }

    if (!formData.modelo?.trim()) {
      errors.push("El modelo es obligatorio");
    }

    if (!formData.fecha_matricula?.trim()) {
      errors.push("La fecha de matrícula es obligatoria");
    }

    return errors;
  };

  const handleEditar = () => {
    if (isEditing) {
      // Guardar cambios
      const errors = validateData();

      if (errors.length > 0) {
        alert("Errores de validación:\n" + errors.join("\n"));

        return;
      }

      setModalAction("guardar");
      onOpen();
    } else {
      // Activar modo edición
      setIsEditing(true);
    }
  };

  const handleConfirmar = () => {
    if (isEditing && hasChanges) {
      // Si está en modo edición con cambios, primero guardar
      const errors = validateData();

      if (errors.length > 0) {
        alert("Errores de validación:\n" + errors.join("\n"));

        return;
      }
    }

    setModalAction("confirmar");
    onOpen();
  };

  const handleCancelEdit = () => {
    if (!currentVehiculo) return;

    setFormData(currentVehiculo);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancelar = () => {
    setModalAction("cancelar");
    onOpen();
  };

  // Función para ejecutar acciones confirmadas
  const executeAction = async () => {
    setIsLoading(true);

    try {
      switch (modalAction) {
        case "cancelar":
          // Aquí iría la llamada al backend para cancelar
          socketService.emit("vehiculo:confirmacion:respuesta", {
            sessionId: procesamiento.sessionId,
            accion: "cancelar",
          });
          break;

        case "guardar":
          setIsEditing(false);
          break;

        case "confirmar":
          if (hasChanges) {
            socketService.emit("vehiculo:confirmacion:respuesta", {
              sessionId: procesamiento.sessionId,
              accion: "editar",
              datosModificados: formData,
            });
          } else {
            socketService.emit("vehiculo:confirmacion:respuesta", {
              sessionId: procesamiento.sessionId,
              accion: "confirmar",
            });
          }
          break;
      }
    } catch (error) {
      console.error("Error ejecutando acción:", error);
      alert("Error al procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      placa: "",
      marca: "",
      clase_vehiculo: "",
      color: "",
      modelo: "",
      linea: "",
    });
    setErrores({
      placa: false,
      marca: false,
      clase_vehiculo: false,
      modelo: false,
      linea: false,
    });
    setDocumentos({});
    setErroresDocumentos({});
    setProcesamiento(initialProcesamientoState);
  };

  // ✅ Función para cargar documentos existentes desde vehiculoEditar
  const cargarDocumentosExistentes = (
    documentosExistentes: DocumentoExistente[],
  ) => {
    const documentosState: Record<string, DocumentoState> = {};

    documentosExistentes.forEach((doc) => {
      documentosState[doc.categoria] = {
        existente: doc,
        esNuevo: false,
        fecha_vigencia: doc.fecha_vigencia
          ? new Date(doc.fecha_vigencia)
          : undefined,
      };
    });

    setDocumentos(documentosState);
  };

  // Efecto para cargar datos cuando se está editando
  useEffect(() => {
    if (vehiculoEditar) {
      setFormData({
        ...vehiculoEditar,
      });

      // ✅ Cargar documentos existentes directamente desde vehiculoEditar
      if (vehiculoEditar.documentos && vehiculoEditar.documentos.length > 0) {
        cargarDocumentosExistentes(vehiculoEditar.documentos);
      }
    } else {
      // Resetear el formulario si no hay conductor para editar
      resetForm();
    }
  }, [vehiculoEditar, isOpen]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error al escribir
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  // Manejar cambios en los selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error al seleccionar
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  // Validar y guardar datos
  const handleSave = async () => {
    setLoading(true);

    if (!subirDocumentos) {
      const camposRequeridos: VehiculoKey[] = [
        "placa",
        "marca",
        "clase_vehiculo",
        "modelo",
        "linea",
        "color",
      ];

      // Campos requeridos para todos los vehículos

      // Validar campos requeridos
      const nuevosErrores: Record<string, boolean> = {};

      camposRequeridos.forEach((campo) => {
        if (!formData[campo]) {
          nuevosErrores[campo] = true;
        }
      });

      setErrores(nuevosErrores);

      // Si hay errores, no continuar
      if (Object.values(nuevosErrores).some((error) => error)) {
        setLoading(false);

        return;
      }
    }

    // Validar documentos requeridos si está habilitado
    if (subirDocumentos) {
      const missingDocs = validateRequiredDocuments();

      if (missingDocs.length > 0) {
        addToast({
          title: `Falta documentación!`,
          description: `Faltan documentos requeridos: ${missingDocs.join(", ")}`,
          color: "danger",
        });
        setLoading(false);

        return;
      }

      // Validar fechas de vigencia requeridas
      const missingVigencias = validateRequiredVigencias();

      if (missingVigencias.length > 0) {
        addToast({
          title: `Falta documentación!`,
          description: `Faltan fechas de vigencia requeridas para: ${missingVigencias.join(", ")}`,
          color: "danger",
        });
        setLoading(false);

        return;
      }
    }

    // Preparar datos completos incluyendo documentos
    const datosCompletos = {
      ...formData,
      documentos: subirDocumentos ? preparearDocumentosParaEnvio() : null,
    };

    try {
      await onSave(
        datosCompletos as
          | CrearVehiculoRequest
          | (CrearVehiculoRequest & { id: string }),
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función actualizada para preparar los documentos para envío
  const preparearDocumentosParaEnvio = () => {
    const documentosParaEnvio: Record<string, any> = {};

    Object.keys(documentos).forEach((key) => {
      const documento = documentos[key];

      if (documento) {
        if (documento.esNuevo && documento.file) {
          // Documento nuevo
          documentosParaEnvio[key] = {
            file: documento.file,
            ...(documento.fecha_vigencia && {
              fecha_vigencia: documento.fecha_vigencia,
            }),
            tipo: "nuevo",
          };
        } else if (!documento.esNuevo && documento.existente) {
          // Documento existente (solo enviar si se cambió la fecha de vigencia)
          documentosParaEnvio[key] = {
            id: documento.existente.id,
            ...(documento.fecha_vigencia && {
              fecha_vigencia: documento.fecha_vigencia,
            }),
            tipo: "existente",
          };
        }
      }
    });

    return documentosParaEnvio;
  };

  const clasesVehiculo = [
    { key: "CAMIONETA", label: "Camioneta" },
    { key: "BUS", label: "Bus" },
    { key: "MICROBUS", label: "Microbús" },
  ];

  // Manejar cambios en los switches
  const handleSwitchChange = (name: string, checked: boolean) => {
    if (name === "subirDocumentos") {
      setSubirDocumentos(checked);
      if (!checked) {
        setDocumentos({});
      }

      return;
    }
  };

  const documentTypes = [
    {
      key: "TARJETA_DE_PROPIEDAD",
      label: "Tarjeta de Propiedad",
      required: true,
      vigencia: false,
    },
    {
      key: "SOAT",
      label: "SOAT",
      required: false,
      vigencia: true,
    },
    {
      key: "TECNOMECANICA",
      label: "Tecnomecánica",
      required: false,
      vigencia: true,
    },
    {
      key: "TARJETA_DE_OPERACION",
      label: "Tarjeta de Operación",
      required: false,
      vigencia: true,
    },
    {
      key: "POLIZA_CONTRACTUAL",
      label: "Póliza Contractual",
      required: false,
      vigencia: true,
    },
    {
      key: "POLIZA_EXTRACONTRACTUAL",
      label: "Póliza Extracontractual",
      required: false,
      vigencia: true,
    },
    {
      key: "POLIZA_TODO_RIESGO",
      label: "Póliza Todo Riesgo",
      required: false,
      vigencia: true,
    },
    {
      key: "CERTIFICADO_GPS",
      label: "Certificado GPS",
      required: false,
      vigencia: true,
    },
  ];

  // ✅ Manejar cambio de documento (actualizado)
  const handleDocumentChange = (
    docKey: string,
    file: File,
    fecha_vigencia?: Date,
  ) => {
    setDocumentos((prev) => {
      const prevDoc = prev[docKey];
      // Only update if file or fecha_vigencia actually changed
      const isSameFile = prevDoc?.file === file;
      const isSameVigencia =
        (!prevDoc?.fecha_vigencia && !fecha_vigencia) ||
        (prevDoc?.fecha_vigencia &&
          fecha_vigencia &&
          prevDoc.fecha_vigencia.getTime() === fecha_vigencia.getTime());

      if (isSameFile && isSameVigencia) {
        return prev;
      }

      return {
        ...prev,
        [docKey]: {
          file,
          fecha_vigencia,
          uploadedAt: new Date(),
          esNuevo: true, // Marcar como nuevo documento
        },
      };
    });

    // Limpiar error al cambiar documento
    if (erroresDocumentos[docKey]) {
      setErroresDocumentos((prev) => ({
        ...prev,
        [docKey]: false,
      }));
    }
  };

  // ✅ Manejar eliminación de documento (actualizado)
  const handleDocumentRemove = (docKey: string) => {
    setDocumentos((prev) => {
      const newDocs = { ...prev };

      delete newDocs[docKey];

      return newDocs;
    });
  };

  // ✅ Validar documentos requeridos (actualizado)
  const validateRequiredDocuments = () => {
    const missingDocs = documentTypes
      .filter((doc) => {
        if (!doc.required) return false;

        const documento = documentos[doc.key];

        // Un documento existe si es nuevo con file o existente
        return !(documento && (documento.file || documento.existente));
      })
      .map((doc) => doc.label);

    return missingDocs;
  };

  // ✅ Validar fechas de vigencia requeridas (actualizado)
  const validateRequiredVigencias = () => {
    const nuevosErroresDocumentos: Record<string, boolean> = {};
    const missingVigencias: string[] = [];

    documentTypes.forEach((doc) => {
      if (doc.required && doc.vigencia) {
        const documento = documentos[doc.key];

        if (documento && (documento.file || documento.existente)) {
          // Si el documento existe pero no tiene fecha de vigencia
          if (!documento.fecha_vigencia) {
            nuevosErroresDocumentos[doc.key] = true;
            missingVigencias.push(doc.label);
          }
        }
      }
    });

    setErroresDocumentos(nuevosErroresDocumentos);

    return missingVigencias;
  };

  // ✅ Eliminar funciones innecesarias
  // Interfaz simplificada para documentos existentes
  interface DocumentoExistente {
    id: string;
    categoria: string;
    nombre_original: string;
    fecha_vigencia: string | null;
    estado: string;
    s3_key: string;
    tamaño: number;
    upload_date: string;
  }

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Modal
      backdrop={"blur"}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={handleClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center space-x-2">
                <TruckIcon className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">
                  {vehiculoEditar ? "Editar Vehículo" : titulo}
                </h3>
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-6">
                {!procesamiento.mensaje && !currentVehiculo && (
                  <div className="flex items-center justify-between border p-3 rounded-md bg-gray-50">
                    <div>
                      <span className="font-medium">
                        Registrar con documentación
                      </span>
                      <p className="text-sm text-gray-500">
                        Marque esta opción si adjuntara documentación del
                        vehículo
                      </p>
                    </div>
                    <Switch
                      color="success"
                      isSelected={subirDocumentos}
                      onChange={(e) =>
                        handleSwitchChange("subirDocumentos", e.target.checked)
                      }
                    />
                  </div>
                )}

                {/* Alert para mostrar el estado del procesamiento */}
                {procesamiento.mensaje !== "" &&
                  procesamiento.mensaje.length > 0 && (
                    <div>
                      <Alert
                        className="w-full"
                        color={
                          procesamiento.error !== "" ||
                          procesamiento.estado === "error"
                            ? "danger"
                            : procesamiento.estado === "completado"
                              ? "success"
                              : "primary"
                        }
                        variant="faded"
                      >
                        {procesamiento.error || procesamiento.mensaje}
                      </Alert>
                    </div>
                  )}

                {currentVehiculo && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <Card>
                      <CardHeader className="flex justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <p className="text-lg font-semibold">
                              Datos Extraídos del Vehículo
                            </p>
                            <p className="text-sm text-default-500">
                              Información obtenida mediante OCR de la tarjeta de
                              propiedad
                            </p>
                          </div>
                        </div>
                        <Chip color="success" size="sm" variant="flat">
                          OCR Completado
                        </Chip>
                      </CardHeader>
                    </Card>

                    {/* Información del Vehículo */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-emerald-600" />
                          <h3 className="text-lg font-semibold">
                            Información del Vehículo
                          </h3>
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody className="gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Placa */}
                          <Input
                            isReadOnly
                            classNames={{
                              input: "text-lg font-semibold",
                              label: "text-default-600 font-medium",
                            }}
                            label="Placa"
                            startContent={
                              <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">
                                  🚗
                                </span>
                              </div>
                            }
                            value={formData.placa}
                            variant="flat"
                          />

                          {/* Marca */}
                          <Input
                            isReadOnly
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            label="Marca"
                            value={formData.marca}
                            variant="flat"
                          />

                          {/* Marca */}
                          <Input
                            isReadOnly
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            label="Clase Vehículo"
                            value={formData.clase_vehiculo}
                            variant="flat"
                          />

                          {/* Modelo (Año) */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("modelo") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("modelo")}
                            label="Modelo (Año)"
                            startContent={
                              <Calendar className="h-4 w-4 text-default-400" />
                            }
                            value={formData.modelo}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange("modelo", e.target.value)
                            }
                          />

                          {/* Línea */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("modelo") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("linea")}
                            label="Línea"
                            value={formData.linea}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange("linea", e.target.value)
                            }
                          />

                          {/* Color */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("color") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("color")}
                            label="Color"
                            startContent={
                              <Hash className="h-4 w-4 text-default-400" />
                            }
                            value={formData.color}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange("color", e.target.value)
                            }
                          />

                          {/* Tipo Carroceria */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("tipo_carroceria") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("tipo_carroceria")}
                            label="Tipo Carroceria"
                            startContent={
                              <Car className="h-4 w-4 text-default-400" />
                            }
                            value={formData.tipo_carroceria}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange(
                                "tipo_carroceria",
                                e.target.value,
                              )
                            }
                          />

                          {/* Número motor */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("numero_motor") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("numero_motor")}
                            label="Número Motor"
                            startContent={
                              <Hash className="h-4 w-4 text-default-400" />
                            }
                            value={formData.numero_motor}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange("numero_motor", e.target.value)
                            }
                          />

                          {/* Número Serie */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("numero_serie") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("numero_serie")}
                            label="Número Serie"
                            startContent={
                              <Hash className="h-4 w-4 text-default-400" />
                            }
                            value={formData.numero_serie}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange("numero_serie", e.target.value)
                            }
                          />

                          {/* Número Chasis */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("numero_chasis") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("numero_chasis")}
                            label="Número Chasis"
                            startContent={
                              <Hash className="h-4 w-4 text-default-400" />
                            }
                            value={formData.numero_chasis}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange("numero_chasis", e.target.value)
                            }
                          />

                          {/* VIN */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("numero_chasis") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("numero_chasis")}
                            label="VIN"
                            startContent={
                              <Hash className="h-4 w-4 text-default-400" />
                            }
                            value={formData.vin}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange("numero_chasis", e.target.value)
                            }
                          />

                          <div className="space-x-2 space-y-2">
                            {/* Fecha de Matrícula */}
                            <Input
                              classNames={{
                                label: "text-default-600 font-medium",
                              }}
                              isReadOnly={!isFieldEditable("fecha_matricula")}
                              label="Fecha de Matrícula"
                              startContent={
                                <Calendar className="h-4 w-4 text-default-400" />
                              }
                              type={
                                isFieldEditable("fecha_matricula")
                                  ? "date"
                                  : "text"
                              }
                              value={formData.fecha_matricula}
                              variant="flat"
                              onChange={(e) =>
                                handleInputChange(
                                  "fecha_matricula",
                                  e.target.value,
                                )
                              }
                            />
                            <p className="italic text-gray-400">
                              {formatearFecha(formData.fecha_matricula)}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Información del Propietario */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-emerald-600" />
                          <h3 className="text-lg font-semibold">
                            Información del Propietario
                          </h3>
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody className="gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Nombre del Propietario */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                              input: "font-medium",
                            }}
                            endContent={
                              isFieldEditable("propietario_nombre") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={!isFieldEditable("propietario_nombre")}
                            isRequired={isFieldEditable("propietario_nombre")}
                            label="Nombre Completo"
                            startContent={
                              <User className="h-4 w-4 text-default-400" />
                            }
                            value={formData.propietario_nombre}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange(
                                "propietario_nombre",
                                e.target.value,
                              )
                            }
                          />

                          {/* Identificación del Propietario */}
                          <Input
                            classNames={{
                              label: "text-default-600 font-medium",
                            }}
                            endContent={
                              isFieldEditable("propietario_identificacion") && (
                                <Edit className="h-4 w-4 text-warning" />
                              )
                            }
                            isReadOnly={
                              !isFieldEditable("propietario_identificacion")
                            }
                            isRequired={isFieldEditable(
                              "propietario_identificacion",
                            )}
                            label="Identificación"
                            startContent={
                              <FileText className="h-4 w-4 text-default-400" />
                            }
                            value={formData.propietario_identificacion}
                            variant="flat"
                            onChange={(e) =>
                              handleInputChange(
                                "propietario_identificacion",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}

                {procesamiento.vehiculo && (
                  <div className="flex flex-col space-y-2">
                    <Card>
                      <CardBody className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Columna izquierda */}
                          <div className="space-y-6">
                            {/* Información básica */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold mb-3 flex items-center border-b pb-2">
                                <Car className="h-4 w-4 mr-2 text-gray-500" />
                                Información Básica
                              </h4>
                              <ul className="space-y-2">
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Placa:
                                  </span>
                                  <span>{procesamiento.vehiculo?.placa}</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Marca:
                                  </span>
                                  <span>{procesamiento.vehiculo?.marca}</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Línea:
                                  </span>
                                  <span>{procesamiento.vehiculo?.linea}</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Modelo:
                                  </span>
                                  <span>{procesamiento.vehiculo?.modelo}</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Color:
                                  </span>
                                  <span>{procesamiento.vehiculo?.color}</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Clase:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.clase_vehiculo}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Carrocería:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.tipo_carroceria ||
                                      "No especificada"}
                                  </span>
                                </li>
                              </ul>
                            </div>

                            {/* Información técnica */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold mb-3 flex items-center border-b pb-2">
                                <PenTool className="h-4 w-4 mr-2 text-gray-500" />
                                Información Técnica
                              </h4>
                              <ul className="space-y-2">
                                <li className="flex items-start">
                                  <span className="font-medium w-32">VIN:</span>
                                  <span>
                                    {procesamiento.vehiculo?.vin ||
                                      "No registrado"}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-32">
                                    No. Motor:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.numero_motor ||
                                      "No registrado"}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-32">
                                    No. Chasis:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.numero_chasis ||
                                      "No registrado"}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-32">
                                    No. Serie:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.numero_serie ||
                                      "No registrado"}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-32">
                                    Combustible:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.combustible ||
                                      "No especificado"}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-32">
                                    Kilometraje:
                                  </span>
                                  <span>
                                    {formatearKilometraje(
                                      procesamiento.vehiculo?.kilometraje,
                                    )}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-32">
                                    Fecha Matricula:
                                  </span>
                                  <span>
                                    {formatearFecha(
                                      procesamiento.vehiculo?.fecha_matricula,
                                    )}
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          {/* Columna derecha */}
                          <div className="space-y-6">
                            {/* Información del propietario */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold mb-3 flex items-center border-b pb-2">
                                <User className="h-4 w-4 mr-2 text-gray-500" />
                                Propietario
                              </h4>
                              <ul className="space-y-2">
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Nombre:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo
                                      ?.propietario_nombre || "No registrado"}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Identificación:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo
                                      ?.propietario_identificacion ||
                                      "No registrado"}
                                  </span>
                                </li>
                              </ul>
                            </div>

                            {/* Información adicional */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold mb-3 flex items-center border-b pb-2">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                Registro en el Sistema
                              </h4>
                              <ul className="space-y-2">
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Creado el:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.createdAt
                                      ? new Date(
                                          procesamiento.vehiculo?.createdAt,
                                        ).toLocaleString("es-CO")
                                      : "No disponible"}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Actualizado:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.updatedAt
                                      ? new Date(
                                          procesamiento.vehiculo?.updatedAt,
                                        ).toLocaleString("es-CO")
                                      : "No disponible"}
                                  </span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-medium w-28">
                                    Conductor:
                                  </span>
                                  <span>
                                    {procesamiento.vehiculo?.conductor_id ||
                                      "No asignado"}
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}

                {/* Barra de progreso - Solo mostrar si NO hay error y NO está completado */}
                {!currentVehiculo &&
                  procesamiento.sessionId &&
                  !procesamiento.error &&
                  procesamiento.estado !== "error" &&
                  procesamiento.estado !== "completado" && (
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <p>Progreso del procesamiento</p>
                        <p>{procesamiento.progreso || 0}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-width ease-in-out duration-300"
                          style={{ width: `${procesamiento.progreso || 0}%` }}
                        />
                      </div>

                      {procesamiento.procesados && procesamiento.total && (
                        <p className="text-sm text-gray-500 mt-1">
                          {procesamiento.procesados} de {procesamiento.total}{" "}
                          documentos procesados
                        </p>
                      )}
                    </div>
                  )}

                {!subirDocumentos && !procesamiento.mensaje && (
                  <div className="border p-4 rounded-md">
                    <h4 className="text-md font-semibold mb-4 border-b pb-2">
                      Información Básica
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        isRequired
                        errorMessage={
                          errores.placa ? "La placa es requerida" : ""
                        }
                        isInvalid={errores.placa}
                        label="Placa"
                        name="placa"
                        placeholder="Ingrese placa"
                        value={formData.placa || ""}
                        onChange={handleChange}
                      />

                      <Input
                        isRequired
                        errorMessage={
                          errores.marca ? "La marca es requerida" : ""
                        }
                        isInvalid={errores.marca}
                        label="Marca"
                        name="marca"
                        placeholder="Ingrese marca"
                        value={formData.marca || ""}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Select
                        isRequired
                        errorMessage={
                          errores.clase_vehiculo ? "La clase es requerida" : ""
                        }
                        isInvalid={errores.clase_vehiculo}
                        label="Clase de Vehículo"
                        name="clase_vehiculo"
                        placeholder="Seleccione una clase"
                        selectedKeys={
                          formData.clase_vehiculo
                            ? [formData.clase_vehiculo]
                            : []
                        }
                        value={formData.clase_vehiculo || ""}
                        onChange={(e) =>
                          handleSelectChange("clase_vehiculo", e.target.value)
                        }
                      >
                        {clasesVehiculo.map((clase) => (
                          <SelectItem key={clase.key} textValue={clase.label}>
                            {clase.label}
                          </SelectItem>
                        ))}
                      </Select>

                      {/* Color */}
                      <Input
                        isRequired
                        errorMessage={
                          errores.color ? "El color es requerido" : ""
                        }
                        isInvalid={errores.color}
                        label="Color"
                        name="color"
                        placeholder="Ingrese color del vehículo"
                        value={formData.color || ""}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Campos para línea y modelo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Input
                        isRequired
                        errorMessage={
                          errores.linea ? "La línea es requerida" : ""
                        }
                        isInvalid={errores.linea}
                        label="Línea"
                        name="linea"
                        placeholder="Ingrese línea del vehículo (ej. Hilux, Corolla)"
                        value={formData.linea || ""}
                        onChange={handleChange}
                      />

                      <Input
                        isRequired
                        errorMessage={
                          errores.modelo ? "El modelo es requerido" : ""
                        }
                        isInvalid={errores.modelo}
                        label="Modelo (Año)"
                        name="modelo"
                        placeholder="Ingrese modelo/año del vehículo"
                        value={formData.modelo || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {subirDocumentos &&
                  !procesamiento.mensaje &&
                  !currentVehiculo && (
                    <div className="border p-4 rounded-md">
                      <h4 className="text-md font-semibold mb-4 border-b pb-2">
                        Documentación
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {documentTypes.map((docType) => {
                          const documento = documentos[docType.key];

                          return (
                            <SimpleDocumentUploader
                              key={docType.key}
                              documentKey={docType.key}
                              fecha_vigencia={documento?.fecha_vigencia || null}
                              file={documento?.file || null}
                              isExisting={
                                !documento?.esNuevo && !!documento?.existente
                              }
                              label={docType.label}
                              required={docType.required}
                              vigencia={docType.vigencia}
                              onChange={handleDocumentChange}
                              onRemove={handleDocumentRemove}
                              errores={erroresDocumentos}
                              // ✅ Pasar documento existente
                              existingDocument={documento?.existente || null}
                            />
                          );
                        })}
                      </div>

                      {/* ✅ Resumen de documentos cargados (actualizado) */}
                      {Object.keys(documentos).length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                          <h3 className="font-medium text-blue-900 mb-2">
                            Documentos cargados (
                            {Object.keys(documentos).length})
                          </h3>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {Object.entries(documentos).map(([key, doc]) => {
                              const docType = documentTypes.find(
                                (d) => d.key === key,
                              );
                              const isNew = doc.esNuevo && doc.file;
                              const isExisting = !doc.esNuevo && doc.existente;

                              return (
                                <li
                                  key={key}
                                  className="flex justify-between items-center"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{docType?.label}</span>
                                    {isNew && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        Nuevo
                                      </span>
                                    )}
                                    {isExisting && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        Existente
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-blue-600">
                                    {doc.fecha_vigencia
                                      ? `Vigente hasta: ${doc.fecha_vigencia.toLocaleDateString("es-ES")}`
                                      : "✓"}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Modal de Confirmación */}
              <Modal isOpen={isOpenConfirm} onOpenChange={onOpenChange}>
                <ModalContent>
                  {(handleClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        {modalAction === "cancelar" && "🚫 Cancelar Registro"}
                        {modalAction === "guardar" && "💾 Guardar Cambios"}
                        {modalAction === "confirmar" && "✅ Confirmar Registro"}
                      </ModalHeader>
                      <ModalBody>
                        {modalAction === "cancelar" && (
                          <p>
                            ¿Está seguro que desea cancelar el registro del
                            vehículo? Esta acción no se puede deshacer.
                          </p>
                        )}
                        {modalAction === "guardar" && currentVehiculo && (
                          <div>
                            <p>¿Desea guardar los siguientes cambios?</p>
                            <div className="mt-3 p-3 bg-default-100 rounded-lg">
                              {editableFields.map((field: string) => {
                                if (
                                  formData[field] !== currentVehiculo[field]
                                ) {
                                  return (
                                    <div key={field} className="text-sm">
                                      <strong>{field}:</strong>{" "}
                                      {currentVehiculo[field]} →{" "}
                                      {formData[field]}
                                    </div>
                                  );
                                }

                                return null;
                              })}
                            </div>
                          </div>
                        )}
                        {modalAction === "confirmar" && (
                          <div>
                            <p>
                              ¿Confirma que desea registrar el vehículo con la
                              siguiente información?
                            </p>
                            <div className="mt-3 p-3 bg-default-100 rounded-lg">
                              <div className="text-sm space-y-1">
                                <div>
                                  <strong>Placa:</strong> {formData.placa}
                                </div>
                                <div>
                                  <strong>Marca:</strong> {formData.marca}
                                </div>
                                <div>
                                  <strong>Modelo:</strong> {formData.modelo}
                                </div>
                                <div>
                                  <strong>Línea:</strong> {formData.linea}
                                </div>
                                <div>
                                  <strong>Color:</strong> {formData.color}
                                </div>
                                <div>
                                  <strong>Fecha Matrícula:</strong>{" "}
                                  {formData.fecha_matricula}
                                </div>
                                <div>
                                  <strong>Propietario Nombre:</strong>{" "}
                                  {formData.propietario_nombre}
                                </div>
                                <div>
                                  <strong>Propietario Identificación:</strong>{" "}
                                  {formData.propietario_identificacion}
                                </div>
                                {hasChanges && (
                                  <div className="text-warning text-xs mt-2">
                                    * Se registrará con los cambios realizados
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          color="danger"
                          variant="light"
                          onPress={handleClose}
                        >
                          Cancelar
                        </Button>
                        <Button
                          color="primary"
                          isLoading={isLoading}
                          onPress={() => {
                            executeAction();
                            handleClose();
                          }}
                        >
                          Confirmar
                        </Button>
                      </ModalFooter>
                    </>
                  )}
                </ModalContent>
              </Modal>
            </ModalBody>

            <ModalFooter>
              {!currentVehiculo ? (
                <div className="flex items-center gap-3">
                  {procesamiento.progreso > 0 ||
                    (procesamiento.mensaje && (
                      <Button
                        className="ml-auto"
                        color="danger"
                        variant="light"
                        onPress={resetForm}
                      >
                        Reiniciar formulario
                      </Button>
                    ))}

                  <Button
                    color="danger"
                    radius="sm"
                    variant="light"
                    onPress={handleClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                    isLoading={loading}
                    startContent={
                      loading ? "" : <SaveIcon className="h-4 w-4" />
                    }
                    onPress={handleSave}
                  >
                    {loading
                      ? vehiculoEditar
                        ? "Actualizando..."
                        : "Guardando..."
                      : vehiculoEditar
                        ? "Actualizar"
                        : "Guardar"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                  {/* Botones */}
                  <div className="flex gap-2">
                    {isEditing && hasChanges && (
                      <Button
                        color="default"
                        radius="sm"
                        startContent={<X className="h-4 w-4" />}
                        variant="flat"
                        onPress={handleCancelEdit}
                      >
                        Descartar cambios
                      </Button>
                    )}

                    <Button
                      color="danger"
                      isDisabled={isLoading}
                      radius="sm"
                      variant="flat"
                      onPress={handleCancelar}
                    >
                      Cancelar
                    </Button>

                    <Button
                      color={isEditing ? "success" : "warning"}
                      isLoading={isLoading && modalAction === "guardar"}
                      radius="sm"
                      startContent={
                        isEditing ? (
                          <Save className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )
                      }
                      variant="flat"
                      onPress={handleEditar}
                    >
                      {isEditing ? "Guardar Cambios" : "Editar Datos"}
                    </Button>

                    <Button
                      color="primary"
                      isLoading={isLoading && modalAction === "confirmar"}
                      radius="sm"
                      variant="flat"
                      onPress={handleConfirmar}
                    >
                      Confirmar y Registrar
                    </Button>
                  </div>
                </div>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalFormVehiculo;
